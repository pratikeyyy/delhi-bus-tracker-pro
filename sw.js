// Service Worker for Delhi Bus Tracker PWA
const CACHE_NAME = 'delhi-bus-tracker-v1.2.1';
const STATIC_CACHE = 'static-v1.2.1';
const DYNAMIC_CACHE = 'dynamic-v1.2.1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/delhi-advanced.html',
  '/manifest.json',
  '/js/enhanced-delhi-data.js',
  '/js/live-tracking.js',
  '/js/notifications.js',
  '/js/analytics-dashboard.js',
  '/js/user-auth.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/buses/,
  /\/api\/routes/,
  /\/api\/stops/,
  /\/api\/health/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content and implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticFile(request.url)) {
    // Cache First strategy for static files
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // Network First strategy for API requests
    event.respondWith(networkFirst(request));
  } else if (isMapTile(request.url)) {
    // Stale While Revalidate for map tiles
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Network First for everything else
    event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy - for static files
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return getOfflineFallback(request);
  }
}

// Network First Strategy - for API requests and dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Stale While Revalidate Strategy - for map tiles
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticFile(url) {
  return STATIC_FILES.some(file => url.includes(file)) || 
         url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.woff') || 
         url.includes('.woff2');
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url)) || url.includes('/api/');
}

function isMapTile(url) {
  // Only treat OpenStreetMap tiles as map tiles to avoid hijacking generic PNGs
  return url.includes('tile.openstreetmap.org') ||
         url.includes('a.tile.openstreetmap.org') ||
         url.includes('b.tile.openstreetmap.org') ||
         url.includes('c.tile.openstreetmap.org');
}

function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    return caches.match('/offline.html') || createOfflinePage();
  }
  
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#666">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delhi Bus Tracker - Offline</title>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #2a2d47 100%);
                color: white;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
            }
            .offline-container {
                max-width: 500px;
                padding: 40px;
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            h1 {
                margin-bottom: 20px;
                color: #ffffff;
            }
            p {
                margin-bottom: 30px;
                color: #b0bec5;
                line-height: 1.6;
            }
            .retry-btn {
                background: #1a237e;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s;
            }
            .retry-btn:hover {
                background: #3f51b5;
            }
            .features {
                margin-top: 30px;
                text-align: left;
            }
            .feature {
                margin-bottom: 10px;
                color: #b0bec5;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">🚌</div>
            <h1>You're Offline</h1>
            <p>Delhi Bus Tracker is currently offline. Some features may not be available, but you can still access cached bus routes and stops.</p>
            
            <button class="retry-btn" onclick="window.location.reload()">
                Try Again
            </button>
            
            <div class="features">
                <h3>Available Offline:</h3>
                <div class="feature">📍 Cached bus routes and stops</div>
                <div class="feature">🗺️ Previously loaded map areas</div>
                <div class="feature">⭐ Your favorite routes</div>
                <div class="feature">📊 Basic route information</div>
            </div>
        </div>
        
        <script>
            // Check for connectivity and reload when back online
            window.addEventListener('online', () => {
                window.location.reload();
            });
            
            // Show connection status
            if (navigator.onLine) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'bus-location-sync') {
    event.waitUntil(syncBusLocations());
  } else if (event.tag === 'user-preferences-sync') {
    event.waitUntil(syncUserPreferences());
  }
});

async function syncBusLocations() {
  try {
    console.log('📍 Syncing bus locations...');
    // In a real app, this would sync cached location updates
    const response = await fetch('/api/buses/locations');
    if (response.ok) {
      const locations = await response.json();
      // Update local cache with new locations
      console.log('✅ Bus locations synced successfully');
    }
  } catch (error) {
    console.error('❌ Failed to sync bus locations:', error);
  }
}

async function syncUserPreferences() {
  try {
    // Service Workers cannot access localStorage; no-op placeholder.
    // In a real implementation, preferences should be passed via postMessage
    // from the client or stored in IndexedDB/caches.
    console.log('⚙️ syncUserPreferences no-op in SW');
  } catch (error) {
    console.error('❌ Failed to sync user preferences:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Push notification received');
  
  const options = {
    body: 'Your bus is arriving soon!',
    icon: '/icons/icon-192x192.svg',
    // Removed badge and per-action icons to avoid 404s; SVG icon is present
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'View Details' },
      { action: 'close', title: 'Close' }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Delhi Bus Tracker';
  }

  event.waitUntil(
    self.registration.showNotification('Delhi Bus Tracker', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'bus-updates') {
    event.waitUntil(updateBusData());
  }
});

async function updateBusData() {
  try {
    console.log('🔄 Updating bus data in background...');
    const response = await fetch('/api/buses/live');
    if (response.ok) {
      const data = await response.json();
      // Cache the updated data
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/buses/live', new Response(JSON.stringify(data)));
      console.log('✅ Bus data updated successfully');
    }
  } catch (error) {
    console.error('❌ Failed to update bus data:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_ROUTE') {
    cacheRoute(event.data.route);
  }
});

async function cacheRoute(routeData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(routeData));
    await cache.put(`/route/${routeData.id}`, response);
    console.log('✅ Route cached successfully:', routeData.id);
  } catch (error) {
    console.error('❌ Failed to cache route:', error);
  }
}

console.log('🚌 Delhi Bus Tracker Service Worker loaded successfully');
