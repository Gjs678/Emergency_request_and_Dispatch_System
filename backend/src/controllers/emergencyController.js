const prisma = require('../config/db');
const { classifyPriority } = require('../services/aiService');
const {
  pushToQueue,
  getPendingQueueIds,
  removeFromQueue,
  cacheActiveEmergencies,
  getCachedActiveEmergencies,
  clearActiveCache,
} = require('../services/redisQueueService');
const { notifyExternalDispatch } = require('../services/redisPubSubService');
const {
  emitNewIncident,
  emitDispatchAssigned,
  emitStatusUpdated,
} = require('../services/websocketService');
const logger = require('../utils/logger');

/**
 * API #1: POST /api/emergency/create
 * Creates emergency request, AI classifies priority, saves to DB, pushes to Redis ZADD queue, emits WS
 */
async function createEmergency(req, res, next) {
  try {
    const { user_id, location, description } = req.body;

    // AI classification
    const aiResult = classifyPriority(description);

    // DB insert
    const incident = await prisma.emergencyRequest.create({
      data: {
        userId: user_id,
        lat: location.lat,
        lng: location.lng,
        description,
        priorityScore: aiResult.priority_score,
        riskFactors: aiResult.risk_factors,
        status: 'PENDING',
      },
    });

    // Redis Priority Queue ZADD
    await pushToQueue(incident.id, incident.priorityScore, new Date(incident.createdAt).getTime());

    // Invalidate active cache
    await clearActiveCache();

    // Broadcast WS event
    emitNewIncident({
      ...incident,
      aiAnalysis: aiResult,
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency incident created successfully',
      data: {
        ...incident,
        aiAnalysis: aiResult,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * API #2: GET /api/emergency/pending
 * Fetches top pending requests ordered by priority score from Redis Priority Queue (ZRANGE / ZREVRANGE)
 */
async function getPendingEmergencies(req, res, next) {
  try {
    const pendingIds = await getPendingQueueIds();

    let pendingIncidents = [];
    if (pendingIds.length > 0) {
      // Fetch DB records for these IDs
      const records = await prisma.emergencyRequest.findMany({
        where: { id: { in: pendingIds } },
        include: { responder: true },
      });

      // Map back to maintain strict Redis ZREVRANGE priority order
      const recordMap = new Map(records.map((r) => [r.id, r]));
      pendingIncidents = pendingIds
        .map((id) => recordMap.get(id))
        .filter(Boolean);
    } else {
      // Fallback if Redis queue is empty
      pendingIncidents = await prisma.emergencyRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: [{ priorityScore: 'desc' }, { createdAt: 'asc' }],
        include: { responder: true },
      });
    }

    return res.status(200).json({
      success: true,
      count: pendingIncidents.length,
      source: pendingIds.length > 0 ? 'REDIS_PRIORITY_QUEUE' : 'DB_FALLBACK',
      data: pendingIncidents,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * API #3: POST /api/emergency/assign
 * Assigns responder, updates DB, removes from Redis priority queue, emits WS event
 */
async function assignResponder(req, res, next) {
  try {
    const { request_id, responder_id } = req.body;

    // Check existence
    const requestExists = await prisma.emergencyRequest.findUnique({
      where: { id: request_id },
    });
    if (!requestExists) {
      return res.status(404).json({ success: false, error: 'Emergency request not found' });
    }

    const responderExists = await prisma.responder.findUnique({
      where: { id: responder_id },
    });
    if (!responderExists) {
      return res.status(404).json({ success: false, error: 'Responder unit not found' });
    }

    // DB updates in transaction
    const [updatedRequest, updatedResponder] = await prisma.$transaction([
      prisma.emergencyRequest.update({
        where: { id: request_id },
        data: {
          status: 'ASSIGNED',
          responderId: responder_id,
        },
        include: { responder: true },
      }),
      prisma.responder.update({
        where: { id: responder_id },
        data: { status: 'DISPATCHED' },
      }),
      prisma.dispatchLog.create({
        data: {
          requestId: request_id,
          responderId: responder_id,
          action: 'DISPATCH_ASSIGNED',
        },
      }),
    ]);

    // Remove from Redis queue
    await removeFromQueue(request_id);

    // Invalidate active cache
    await clearActiveCache();

    // WS Emit
    emitDispatchAssigned({
      requestId: request_id,
      responderId: responder_id,
      status: 'ASSIGNED',
      request: updatedRequest,
      responder: updatedResponder,
    });

    return res.status(200).json({
      success: true,
      message: 'Responder successfully assigned to incident',
      data: {
        request: updatedRequest,
        responder: updatedResponder,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * API #4: PATCH /api/emergency/status
 * Updates status in DB, emits WS event, clears active cache
 */
async function updateStatus(req, res, next) {
  try {
    const { request_id, status } = req.body;

    const requestExists = await prisma.emergencyRequest.findUnique({
      where: { id: request_id },
    });
    if (!requestExists) {
      return res.status(404).json({ success: false, error: 'Emergency request not found' });
    }

    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: request_id },
      data: { status },
      include: { responder: true },
    });

    // If RESOLVED or CANCELLED, release the responder back to AVAILABLE
    if ((status === 'RESOLVED' || status === 'CANCELLED') && requestExists.responderId) {
      await prisma.responder.update({
        where: { id: requestExists.responderId },
        data: { status: 'AVAILABLE' },
      });
      await removeFromQueue(request_id);
    }

    // Invalidate Redis active cache
    await clearActiveCache();

    // WS Emit
    emitStatusUpdated({
      requestId: request_id,
      status,
      updatedAt: updatedRequest.updatedAt,
    });

    return res.status(200).json({
      success: true,
      message: `Emergency status updated to ${status}`,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * API #5: GET /api/emergency/active
 * Fetches active ongoing requests with Redis caching layer (30s TTL)
 */
async function getActiveEmergencies(req, res, next) {
  try {
    // Check Redis cache first
    const cachedData = await getCachedActiveEmergencies();
    if (cachedData) {
      return res.status(200).json({
        success: true,
        source: 'REDIS_CACHE_TTL_30S',
        count: cachedData.length,
        data: cachedData,
      });
    }

    // DB Query if cache miss
    const activeEmergencies = await prisma.emergencyRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE'] },
      },
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
      include: { responder: true },
    });

    // Store in Redis with 30s TTL
    await cacheActiveEmergencies(activeEmergencies);

    return res.status(200).json({
      success: true,
      source: 'DATABASE_FETCH',
      count: activeEmergencies.length,
      data: activeEmergencies,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * API #6: POST /api/emergency/notify-dispatch
 * Triggers Redis Pub/Sub event for external dispatch integration
 */
async function notifyExternalDispatchController(req, res, next) {
  try {
    const { request_id } = req.body;

    const incident = await prisma.emergencyRequest.findUnique({
      where: { id: request_id },
      include: { responder: true },
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Emergency request not found' });
    }

    const pubsubPayload = await notifyExternalDispatch(request_id, incident);

    return res.status(200).json({
      success: true,
      message: 'Redis Pub/Sub notification sent to external dispatch listener',
      data: pubsubPayload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Auxiliary GET /api/emergency/responders
 * Returns all active responder units for map view
 */
async function getResponders(req, res, next) {
  try {
    const responders = await prisma.responder.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({
      success: true,
      count: responders.length,
      data: responders,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEmergency,
  getPendingEmergencies,
  assignResponder,
  updateStatus,
  getActiveEmergencies,
  notifyExternalDispatchController,
  getResponders,
};
