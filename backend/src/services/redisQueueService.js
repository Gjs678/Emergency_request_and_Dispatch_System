const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const QUEUE_KEY = 'emergency_priority_queue';
const ACTIVE_CACHE_KEY = 'active_emergencies';
const ACTIVE_CACHE_TTL = 30; // seconds

/**
 * Calculates a composite Redis sorted set score.
 * Higher priorityScore (5 vs 1) yields a higher score.
 * For tied priorityScores, earlier timestamps yield slightly higher composite scores.
 */
function calculateScore(priorityScore, createdAt = Date.now()) {
  // Priority (5..1) scaled by 1e12, plus reverse timestamp so earlier arrival wins tie
  const reverseTimestamp = 1e13 - createdAt;
  return priorityScore * 1e12 + reverseTimestamp;
}

/**
 * Adds an emergency request ID to the Redis priority queue with ZADD
 */
async function pushToQueue(requestId, priorityScore, createdAt = Date.now()) {
  try {
    const score = calculateScore(priorityScore, createdAt);
    await redisClient.zadd(QUEUE_KEY, score, requestId);
    logger.info(`Redis ZADD: requestId=${requestId}, score=${score}, priority=${priorityScore}`);
  } catch (error) {
    logger.error(`Redis ZADD failed for ${requestId}: ${error.message}`);
  }
}

/**
 * Gets pending emergency IDs from Redis priority queue ordered by highest priority
 */
async function getPendingQueueIds() {
  try {
    // ZREVRANGE returns items in descending order of score
    const requestIds = await redisClient.zrevrange(QUEUE_KEY, 0, -1);
    return requestIds;
  } catch (error) {
    logger.error(`Redis ZREVRANGE failed: ${error.message}`);
    return [];
  }
}

/**
 * Removes an emergency request ID from the Redis priority queue
 */
async function removeFromQueue(requestId) {
  try {
    await redisClient.zrem(QUEUE_KEY, requestId);
    logger.info(`Redis ZREM: requestId=${requestId} removed from priority queue`);
  } catch (error) {
    logger.error(`Redis ZREM failed for ${requestId}: ${error.message}`);
  }
}

/**
 * Caches active emergencies in Redis with a 30s TTL
 */
async function cacheActiveEmergencies(data) {
  try {
    await redisClient.setex(ACTIVE_CACHE_KEY, ACTIVE_CACHE_TTL, JSON.stringify(data));
    logger.info(`Redis SETEX active_emergencies cached for ${ACTIVE_CACHE_TTL}s`);
  } catch (error) {
    logger.error(`Redis cache set failed: ${error.message}`);
  }
}

/**
 * Fetches cached active emergencies from Redis
 */
async function getCachedActiveEmergencies() {
  try {
    const cached = await redisClient.get(ACTIVE_CACHE_KEY);
    if (cached) {
      logger.info('Redis GET active_emergencies: CACHE HIT');
      return JSON.parse(cached);
    }
    logger.info('Redis GET active_emergencies: CACHE MISS');
    return null;
  } catch (error) {
    logger.error(`Redis GET failed: ${error.message}`);
    return null;
  }
}

/**
 * Clears the active emergency cache (e.g. on status changes)
 */
async function clearActiveCache() {
  try {
    await redisClient.del(ACTIVE_CACHE_KEY);
    logger.info('Redis DEL active_emergencies: Cache invalidated');
  } catch (error) {
    logger.error(`Redis cache clear failed: ${error.message}`);
  }
}

module.exports = {
  pushToQueue,
  getPendingQueueIds,
  removeFromQueue,
  cacheActiveEmergencies,
  getCachedActiveEmergencies,
  clearActiveCache,
};
