const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

function initWebsocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket Client Connected: ${socket.id}`);

    socket.on('join_responder', (responderId) => {
      socket.join(`responder_${responderId}`);
      logger.info(`Socket ${socket.id} joined room responder_${responderId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
}

/**
 * Emits NEW_INCIDENT event to all connected dashboard clients
 */
function emitNewIncident(incident) {
  if (io) {
    io.emit('NEW_INCIDENT', incident);
    logger.info(`WS Emit [NEW_INCIDENT]: id=${incident.id}, priority=${incident.priorityScore}`);
  }
}

/**
 * Emits DISPATCH_ASSIGNED event to all clients and responder room
 */
function emitDispatchAssigned(data) {
  if (io) {
    io.emit('DISPATCH_ASSIGNED', data);
    if (data.responderId) {
      io.to(`responder_${data.responderId}`).emit('MY_DISPATCH_ASSIGNED', data);
    }
    logger.info(`WS Emit [DISPATCH_ASSIGNED]: request=${data.requestId}, responder=${data.responderId}`);
  }
}

/**
 * Emits STATUS_UPDATED event to all connected clients
 */
function emitStatusUpdated(data) {
  if (io) {
    io.emit('STATUS_UPDATED', data);
    logger.info(`WS Emit [STATUS_UPDATED]: request=${data.requestId}, status=${data.status}`);
  }
}

module.exports = {
  initWebsocket,
  getIO,
  emitNewIncident,
  emitDispatchAssigned,
  emitStatusUpdated,
};
