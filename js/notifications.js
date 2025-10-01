// Advanced Real-Time Notifications System for Delhi Bus Tracker
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.subscribers = new Map();
        this.notificationQueue = [];
        this.isProcessing = false;
        this.settings = {
            sound: true,
            desktop: true,
            busArrival: true,
            delays: true,
            routeUpdates: true,
            emergencies: true
        };
        
        this.init();
    }

    async init() {
        // Request notification permission
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
            }
        }

        // Create notification container
        this.createNotificationContainer();
        
        // Load user preferences
        this.loadSettings();
        
        // Start monitoring system
        this.startMonitoring();
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.innerHTML = `
            <style>
                #notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                }
                
                .notification-item {
                    background: linear-gradient(135deg, #1a237e, #3f51b5);
                    color: white;
                    padding: 16px;
                    margin-bottom: 10px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    animation: slideIn 0.3s ease-out;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .notification-item:hover {
                    transform: translateX(-5px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                }
                
                .notification-item.success {
                    background: linear-gradient(135deg, #00c853, #4caf50);
                }
                
                .notification-item.warning {
                    background: linear-gradient(135deg, #ff9800, #ffc107);
                }
                
                .notification-item.error {
                    background: linear-gradient(135deg, #f44336, #e57373);
                }
                
                .notification-item.info {
                    background: linear-gradient(135deg, #2196f3, #64b5f6);
                }
                
                .notification-header {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .notification-title {
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .notification-time {
                    font-size: 11px;
                    opacity: 0.8;
                    margin-left: auto;
                }
                
                .notification-body {
                    font-size: 13px;
                    line-height: 1.4;
                    opacity: 0.9;
                }
                
                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                .notification-settings {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 15px;
                    display: none;
                    z-index: 10001;
                    min-width: 250px;
                }
                
                .settings-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    z-index: 10000;
                }
            </style>
            
            <div id="notifications-list"></div>
            
            <button class="settings-toggle" onclick="notificationManager.toggleSettings()" title="Notification Settings">
                🔔
            </button>
            
            <div class="notification-settings" id="notification-settings">
                <h6>🔔 Notification Settings</h6>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="sound-setting" checked>
                    <label class="form-check-label" for="sound-setting">Sound Alerts</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="desktop-setting" checked>
                    <label class="form-check-label" for="desktop-setting">Desktop Notifications</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="arrival-setting" checked>
                    <label class="form-check-label" for="arrival-setting">Bus Arrivals</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="delay-setting" checked>
                    <label class="form-check-label" for="delay-setting">Delays & Updates</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="route-setting" checked>
                    <label class="form-check-label" for="route-setting">Route Changes</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="emergency-setting" checked>
                    <label class="form-check-label" for="emergency-setting">Emergency Alerts</label>
                </div>
                <button class="btn btn-primary btn-sm mt-2 w-100" onclick="notificationManager.saveSettings()">
                    Save Settings
                </button>
            </div>
        `;
        
        document.body.appendChild(container);
    }

    show(title, message, type = 'info', duration = 5000, data = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            title,
            message,
            type,
            timestamp: new Date(),
            duration,
            data
        };

        this.notifications.unshift(notification);
        this.renderNotification(notification);

        // Desktop notification
        if (this.settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                tag: notification.id
            });
        }

        // Sound notification
        if (this.settings.sound) {
            this.playNotificationSound(type);
        }

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }

        return notification.id;
    }

    renderNotification(notification) {
        const container = document.getElementById('notifications-list');
        const element = document.createElement('div');
        element.className = `notification-item ${notification.type}`;
        element.id = `notification-${notification.id}`;
        
        element.innerHTML = `
            <button class="notification-close" onclick="notificationManager.remove('${notification.id}')">&times;</button>
            <div class="notification-header">
                <div class="notification-title">${this.getTypeIcon(notification.type)} ${notification.title}</div>
                <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
            </div>
            <div class="notification-body">${notification.message}</div>
        `;

        element.onclick = () => {
            if (notification.data.action) {
                notification.data.action();
            }
            this.remove(notification.id);
        };

        container.insertBefore(element, container.firstChild);
    }

    remove(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (element) {
            element.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                element.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    getTypeIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️',
            bus: '🚌',
            route: '🛣️',
            time: '⏰'
        };
        return icons[type] || icons.info;
    }

    formatTime(timestamp) {
        return timestamp.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    playNotificationSound(type) {
        // Create audio context for notification sounds
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const frequencies = {
            success: [523, 659, 784],
            warning: [440, 554],
            error: [330, 277],
            info: [523, 659]
        };

        const freq = frequencies[type] || frequencies.info;
        this.playTone(freq[0], 0.1);
        
        if (freq[1]) {
            setTimeout(() => this.playTone(freq[1], 0.1), 100);
        }
        if (freq[2]) {
            setTimeout(() => this.playTone(freq[2], 0.1), 200);
        }
    }

    playTone(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    startMonitoring() {
        // Monitor bus arrivals
        setInterval(() => {
            this.checkBusArrivals();
        }, 10000); // Check every 10 seconds

        // Monitor delays
        setInterval(() => {
            this.checkDelays();
        }, 15000); // Check every 15 seconds

        // Monitor route changes
        setInterval(() => {
            this.checkRouteUpdates();
        }, 30000); // Check every 30 seconds
    }

    checkBusArrivals() {
        if (!this.settings.busArrival) return;

        ENHANCED_DELHI_DATA.liveBuses.forEach(bus => {
            if (bus.eta <= 2 && bus.eta > 0 && bus.status === 'running') {
                const notificationId = `arrival-${bus.id}-${bus.currentStop}`;
                
                // Avoid duplicate notifications
                if (!this.recentNotifications.has(notificationId)) {
                    this.show(
                        'Bus Arriving Soon!',
                        `🚌 ${bus.id} (${ENHANCED_DELHI_DATA.routes[bus.route].name}) arriving at ${bus.nextStop} in ${bus.eta} minutes`,
                        'bus',
                        8000,
                        {
                            action: () => {
                                if (window.busTracker) {
                                    window.busTracker.selectBus(bus);
                                }
                            }
                        }
                    );
                    
                    this.recentNotifications.set(notificationId, Date.now());
                }
            }
        });

        // Clean old notification IDs
        if (!this.recentNotifications) {
            this.recentNotifications = new Map();
        }
        
        const now = Date.now();
        for (const [key, timestamp] of this.recentNotifications.entries()) {
            if (now - timestamp > 300000) { // 5 minutes
                this.recentNotifications.delete(key);
            }
        }
    }

    checkDelays() {
        if (!this.settings.delays) return;

        ENHANCED_DELHI_DATA.liveBuses.forEach(bus => {
            if (bus.delay > 5) {
                const notificationId = `delay-${bus.id}`;
                
                if (!this.recentNotifications.has(notificationId)) {
                    this.show(
                        'Significant Delay Alert',
                        `🚌 ${bus.id} is running ${bus.delay} minutes late on ${ENHANCED_DELHI_DATA.routes[bus.route].name}`,
                        'warning',
                        10000
                    );
                    
                    this.recentNotifications.set(notificationId, Date.now());
                }
            }
        });
    }

    checkRouteUpdates() {
        if (!this.settings.routeUpdates) return;

        // Simulate route updates (in real app, this would come from server)
        if (Math.random() > 0.95) {
            const routes = Object.keys(ENHANCED_DELHI_DATA.routes);
            const randomRoute = routes[Math.floor(Math.random() * routes.length)];
            
            this.show(
                'Route Update',
                `📍 Route ${randomRoute} has been updated with new stops and timings`,
                'info',
                7000
            );
        }
    }

    // Predefined notification methods
    busArrival(busId, stop, eta) {
        this.show(
            'Bus Arriving',
            `🚌 Bus ${busId} arriving at ${stop} in ${eta} minutes`,
            'bus',
            6000
        );
    }

    busDelay(busId, delay) {
        this.show(
            'Delay Alert',
            `🚌 Bus ${busId} is delayed by ${delay} minutes`,
            'warning',
            8000
        );
    }

    routeChange(routeId, change) {
        this.show(
            'Route Update',
            `🛣️ Route ${routeId}: ${change}`,
            'info',
            10000
        );
    }

    emergency(message) {
        this.show(
            'Emergency Alert',
            `🚨 ${message}`,
            'error',
            0 // Don't auto-dismiss
        );
    }

    success(title, message) {
        this.show(title, message, 'success', 4000);
    }

    toggleSettings() {
        const settings = document.getElementById('notification-settings');
        settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
    }

    saveSettings() {
        this.settings = {
            sound: document.getElementById('sound-setting').checked,
            desktop: document.getElementById('desktop-setting').checked,
            busArrival: document.getElementById('arrival-setting').checked,
            delays: document.getElementById('delay-setting').checked,
            routeUpdates: document.getElementById('route-setting').checked,
            emergencies: document.getElementById('emergency-setting').checked
        };

        localStorage.setItem('busTracker_notifications', JSON.stringify(this.settings));
        this.show('Settings Saved', 'Your notification preferences have been updated', 'success', 3000);
        this.toggleSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('busTracker_notifications');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            
            // Update UI
            document.getElementById('sound-setting').checked = this.settings.sound;
            document.getElementById('desktop-setting').checked = this.settings.desktop;
            document.getElementById('arrival-setting').checked = this.settings.busArrival;
            document.getElementById('delay-setting').checked = this.settings.delays;
            document.getElementById('route-setting').checked = this.settings.routeUpdates;
            document.getElementById('emergency-setting').checked = this.settings.emergencies;
        }
    }

    // Subscribe to specific bus/route notifications
    subscribe(type, id, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Map());
        }
        this.subscribers.get(type).set(id, callback);
    }

    unsubscribe(type, id) {
        if (this.subscribers.has(type)) {
            this.subscribers.get(type).delete(id);
        }
    }

    // Clear all notifications
    clearAll() {
        const container = document.getElementById('notifications-list');
        container.innerHTML = '';
        this.notifications = [];
    }
}

// Initialize notification manager
let notificationManager;

document.addEventListener('DOMContentLoaded', function() {
    notificationManager = new NotificationManager();
    window.notificationManager = notificationManager;
    
    // Welcome notification
    setTimeout(() => {
        notificationManager.show(
            'Welcome to Delhi Bus Tracker Pro!',
            '🚌 Real-time notifications are now active. Click the bell icon to customize your preferences.',
            'success',
            8000
        );
    }, 2000);
});
