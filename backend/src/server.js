require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { initWebsocket } = require('./services/websocketService');
const emergencyRoutes = require('./routes/emergencyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorMiddleware');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging
app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Emergency Request & Dispatch System Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Initialize Socket.io
initWebsocket(server);

server.listen(PORT, () => {
  logger.info(`========================================================`);
  logger.info(`🚨 Emergency Dispatch System Server running on port ${PORT}`);
  logger.info(`⚡ WebSockets & Redis Priority Queue Engine Operational`);
  logger.info(`========================================================`);
});
