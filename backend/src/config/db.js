const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => logger.info('Successfully connected to PostgreSQL database'))
  .catch((err) => logger.error('PostgreSQL connection error: ' + err.message));

module.exports = prisma;
