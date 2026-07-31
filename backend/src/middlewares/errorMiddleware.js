const logger = require('../utils/logger');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Route Not Found - ${req.originalUrl}`,
  });
}

function globalErrorHandler(err, req, res, next) {
  logger.error(`Unhandled Error: ${err.message} \nStack: ${err.stack}`);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
