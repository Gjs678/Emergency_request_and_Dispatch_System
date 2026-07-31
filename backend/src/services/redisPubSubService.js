const { redisPublisher, redisSubscriber } = require('../config/redis');
const logger = require('../utils/logger');

const EXTERNAL_DISPATCH_CHANNEL = 'emergency:external_dispatch';

// Subscribe to external dispatch channel for event logging & integration
redisSubscriber.subscribe(EXTERNAL_DISPATCH_CHANNEL, (err, count) => {
  if (err) {
    logger.error(`Failed to subscribe to Redis Pub/Sub channel ${EXTERNAL_DISPATCH_CHANNEL}: ${err.message}`);
  } else {
    logger.info(`Redis Subscribed to channel '${EXTERNAL_DISPATCH_CHANNEL}' (Active channels: ${count})`);
  }
});

redisSubscriber.on('message', (channel, message) => {
  try {
    const payload = JSON.parse(message);
    logger.info(`⚡ [Redis Pub/Sub Event] Channel: ${channel} | Payload: ${JSON.stringify(payload)}`);
  } catch (error) {
    logger.info(`⚡ [Redis Pub/Sub Event] Channel: ${channel} | Raw: ${message}`);
  }
});

/**
 * Publishes a dispatch notification to Redis Pub/Sub for external dispatch listeners
 */
async function notifyExternalDispatch(requestId, incidentData) {
  try {
    const payload = {
      event: 'DISPATCH_TRIGGERED',
      requestId,
      data: incidentData,
      timestamp: new Date().toISOString(),
    };
    await redisPublisher.publish(EXTERNAL_DISPATCH_CHANNEL, JSON.stringify(payload));
    logger.info(`Redis PUBLISH to ${EXTERNAL_DISPATCH_CHANNEL} for requestId: ${requestId}`);
    return payload;
  } catch (error) {
    logger.error(`Redis PUBLISH failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  notifyExternalDispatch,
  EXTERNAL_DISPATCH_CHANNEL,
};
