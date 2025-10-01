const admin = require('firebase-admin');
const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      if (process.env.FCM_SERVER_KEY && !this.initialized) {
        // Initialize Firebase Admin SDK
        // In production, use service account key file
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
        this.initialized = true;
        logger.info('Firebase Admin SDK initialized');
      } else {
        logger.warn('Firebase credentials not configured, push notifications disabled');
      }
    } catch (error) {
      logger.error('Firebase initialization error:', error);
    }
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
        logger.warn(`No device tokens found for user ${userId}`);
        return { success: false, message: 'No device tokens' };
      }

      const tokens = user.deviceTokens.map(dt => dt.token);
      return await this.sendToTokens(tokens, notification);

    } catch (error) {
      logger.error('Send to user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple tokens
  async sendToTokens(tokens, notification) {
    if (!this.initialized) {
      logger.warn('Firebase not initialized, cannot send notifications');
      return { success: false, message: 'Service not initialized' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        tokens: tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      logger.info(`Notifications sent`, {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length
      });

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: tokens[idx],
              error: resp.error?.code
            });
          }
        });

        // Remove invalid tokens
        await this.removeInvalidTokens(failedTokens);
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      logger.error('Send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to topic (for broadcast messages)
  async sendToTopic(topic, notification) {
    if (!this.initialized) {
      logger.warn('Firebase not initialized, cannot send notifications');
      return { success: false, message: 'Service not initialized' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        topic: topic
      };

      const response = await admin.messaging().send(message);
      
      logger.info(`Topic notification sent`, { topic, messageId: response });
      
      return { success: true, messageId: response };

    } catch (error) {
      logger.error('Send topic notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe user to topic
  async subscribeToTopic(userId, topic) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
        return { success: false, message: 'No device tokens' };
      }

      const tokens = user.deviceTokens.map(dt => dt.token);
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      
      logger.info(`User subscribed to topic`, { userId, topic, successCount: response.successCount });
      
      return { success: true, successCount: response.successCount };

    } catch (error) {
      logger.error('Subscribe to topic error:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove invalid device tokens
  async removeInvalidTokens(failedTokens) {
    try {
      const invalidTokens = failedTokens
        .filter(ft => ft.error === 'messaging/invalid-registration-token' || 
                     ft.error === 'messaging/registration-token-not-registered')
        .map(ft => ft.token);

      if (invalidTokens.length > 0) {
        await User.updateMany(
          { 'deviceTokens.token': { $in: invalidTokens } },
          { $pull: { deviceTokens: { token: { $in: invalidTokens } } } }
        );

        logger.info(`Removed ${invalidTokens.length} invalid tokens`);
      }
    } catch (error) {
      logger.error('Remove invalid tokens error:', error);
    }
  }

  // Send bus arrival notification
  async sendBusArrivalNotification(userId, busInfo, stopInfo, eta) {
    const notification = {
      title: `Bus ${busInfo.busNumber} Arriving`,
      body: `Your bus will arrive at ${stopInfo.name} in ${eta} minutes`,
      data: {
        type: 'bus_arrival',
        busId: busInfo.busId,
        busNumber: busInfo.busNumber,
        stopId: stopInfo.stopId,
        stopName: stopInfo.name,
        eta: eta.toString()
      }
    };

    return await this.sendToUser(userId, notification);
  }

  // Send delay notification
  async sendDelayNotification(userId, busInfo, delayMinutes) {
    const notification = {
      title: `Bus ${busInfo.busNumber} Delayed`,
      body: `Your bus is delayed by ${delayMinutes} minutes`,
      data: {
        type: 'delay',
        busId: busInfo.busId,
        busNumber: busInfo.busNumber,
        delay: delayMinutes.toString()
      }
    };

    return await this.sendToUser(userId, notification);
  }

  // Send route disruption notification
  async sendDisruptionNotification(routeInfo, message) {
    const notification = {
      title: `Route ${routeInfo.routeNumber} Disruption`,
      body: message,
      data: {
        type: 'disruption',
        routeId: routeInfo.routeId,
        routeNumber: routeInfo.routeNumber
      }
    };

    return await this.sendToTopic(`route_${routeInfo.routeId}`, notification);
  }

  // Send emergency alert
  async sendEmergencyAlert(message, location) {
    const notification = {
      title: 'Emergency Alert',
      body: message,
      data: {
        type: 'emergency',
        location: JSON.stringify(location),
        timestamp: new Date().toISOString()
      }
    };

    return await this.sendToTopic('emergency_alerts', notification);
  }

  // Send driver alert to admin
  async sendDriverAlert(driverInfo, alertType, message) {
    const notification = {
      title: `Driver Alert: ${alertType}`,
      body: `${driverInfo.name}: ${message}`,
      data: {
        type: 'driver_alert',
        driverId: driverInfo.driverId,
        driverName: driverInfo.name,
        alertType,
        message
      }
    };

    return await this.sendToTopic('admin_alerts', notification);
  }

  // Send promotional notification
  async sendPromotionalNotification(userIds, title, body, data = {}) {
    const results = [];
    
    for (const userId of userIds) {
      const notification = {
        title,
        body,
        data: {
          type: 'promotional',
          ...data
        }
      };
      
      const result = await this.sendToUser(userId, notification);
      results.push({ userId, ...result });
    }

    return results;
  }

  // Schedule notification (would integrate with a job queue in production)
  async scheduleNotification(userId, notification, scheduleTime) {
    // In production, this would use a job queue like Bull or Agenda
    const delay = scheduleTime.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        await this.sendToUser(userId, notification);
      }, delay);
      
      logger.info(`Notification scheduled`, { userId, scheduleTime });
      return { success: true, message: 'Notification scheduled' };
    } else {
      return { success: false, message: 'Schedule time must be in the future' };
    }
  }

  // Get notification statistics
  async getNotificationStats(period = 30) {
    // In production, this would query a notifications log collection
    return {
      period,
      totalSent: 1250,
      successful: 1180,
      failed: 70,
      byType: {
        bus_arrival: 450,
        delay: 320,
        disruption: 180,
        emergency: 5,
        promotional: 295
      },
      byPlatform: {
        android: 780,
        ios: 400,
        web: 70
      }
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
