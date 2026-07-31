const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

let MockRedis;
try {
  MockRedis = require('ioredis-mock');
} catch (e) {
  MockRedis = null;
}

let redisClient, redisPublisher, redisSubscriber;

if (MockRedis) {
  // Use in-memory mock when native Redis is not running
  const mainMock = new MockRedis();
  redisClient = mainMock;
  redisPublisher = mainMock.duplicate();
  redisSubscriber = mainMock.duplicate();

  if (logger && logger.info) {
    logger.info('Initialized In-Memory Redis Mock instances (Main, Pub, Sub).');
  } else {
    console.log('Initialized In-Memory Redis Mock instances (Main, Pub, Sub).');
  }
} else {
  const redisOptions = {
    host: redisHost,
    port: redisPort,
    retryStrategy(times) {
      return Math.min(times * 100, 2000);
    },
    maxRetriesPerRequest: null,
  };

  redisClient = new Redis(redisOptions);
  redisPublisher = new Redis(redisOptions);
  redisSubscriber = new Redis(redisOptions);

  redisClient.on('connect', () => logger.info(`Redis Connected [Main]: ${redisHost}:${redisPort}`));
  redisClient.on('error', (err) => logger.error(`Redis Error [Main]: ${err.message}`));
}

module.exports = {
  redisClient,
  redisPublisher,
  redisSubscriber,
};