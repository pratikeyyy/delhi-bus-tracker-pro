const logger = require('../utils/logger');

let io;

const initializeSocketHandlers = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room for specific bus tracking
    socket.on('trackBus', (busId) => {
      socket.join(`bus_${busId}`);
      logger.info(`Client ${socket.id} tracking bus ${busId}`);
    });

    // Join room for route tracking
    socket.on('trackRoute', (routeId) => {
      socket.join(`route_${routeId}`);
      logger.info(`Client ${socket.id} tracking route ${routeId}`);
    });

    // Join room for general updates
    socket.on('trackGeneral', () => {
      socket.join('general_updates');
      logger.info(`Client ${socket.id} joined general updates`);
    });

    // Driver location sharing
    socket.on('driverOnline', (data) => {
      const { driverId, busId } = data;
      socket.join(`driver_${driverId}`);
      socket.join(`bus_${busId}`);
      
      // Broadcast driver online status
      socket.to('general_updates').emit('driverStatusUpdate', {
        driverId,
        busId,
        status: 'online',
        timestamp: new Date()
      });
    });

    // Passenger location requests
    socket.on('requestBusLocation', (busId) => {
      socket.emit('busLocationRequested', { busId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

// Broadcast location update to all tracking clients
const broadcastLocationUpdate = (busId, locationData) => {
  if (!io) return;

  const updateData = {
    busId,
    timestamp: new Date(),
    ...locationData
  };

  // Send to specific bus trackers
  io.to(`bus_${busId}`).emit('locationUpdate', updateData);

  // Send to route trackers if route info available
  if (locationData.routeId) {
    io.to(`route_${locationData.routeId}`).emit('routeLocationUpdate', updateData);
  }

  // Send to general updates room
  io.to('general_updates').emit('generalLocationUpdate', updateData);

  logger.info(`Location broadcast sent for bus ${busId}`, { updateData });
};

// Broadcast ETA updates
const broadcastETAUpdate = (busId, etaData) => {
  if (!io) return;

  const updateData = {
    busId,
    timestamp: new Date(),
    ...etaData
  };

  io.to(`bus_${busId}`).emit('etaUpdate', updateData);
  io.to('general_updates').emit('generalETAUpdate', updateData);

  logger.info(`ETA broadcast sent for bus ${busId}`, { updateData });
};

// Broadcast alerts and notifications
const broadcastAlert = (type, data) => {
  if (!io) return;

  const alertData = {
    type,
    timestamp: new Date(),
    ...data
  };

  // Send to all connected clients
  io.emit('alert', alertData);

  // Send to specific rooms if applicable
  if (data.busId) {
    io.to(`bus_${data.busId}`).emit('busAlert', alertData);
  }

  if (data.routeId) {
    io.to(`route_${data.routeId}`).emit('routeAlert', alertData);
  }

  logger.info(`Alert broadcast sent: ${type}`, { alertData });
};

// Broadcast trip status updates
const broadcastTripUpdate = (tripId, tripData) => {
  if (!io) return;

  const updateData = {
    tripId,
    timestamp: new Date(),
    ...tripData
  };

  if (tripData.busId) {
    io.to(`bus_${tripData.busId}`).emit('tripUpdate', updateData);
  }

  if (tripData.routeId) {
    io.to(`route_${tripData.routeId}`).emit('routeTripUpdate', updateData);
  }

  io.to('general_updates').emit('generalTripUpdate', updateData);

  logger.info(`Trip update broadcast sent for trip ${tripId}`, { updateData });
};

// Send notification to specific user
const sendUserNotification = (userId, notification) => {
  if (!io) return;

  io.to(`user_${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date()
  });

  logger.info(`Notification sent to user ${userId}`, { notification });
};

// Get connected clients count
const getConnectedClientsCount = () => {
  if (!io) return 0;
  return io.engine.clientsCount;
};

// Get clients in specific room
const getRoomClientsCount = (room) => {
  if (!io) return 0;
  const roomClients = io.sockets.adapter.rooms.get(room);
  return roomClients ? roomClients.size : 0;
};

module.exports = {
  initializeSocketHandlers,
  broadcastLocationUpdate,
  broadcastETAUpdate,
  broadcastAlert,
  broadcastTripUpdate,
  sendUserNotification,
  getConnectedClientsCount,
  getRoomClientsCount
};
