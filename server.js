require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize logger (simple console logger for now)
const logger = {
    info: (msg) => console.log('ℹ️', msg),
    error: (msg) => console.error('❌', msg),
    warn: (msg) => console.warn('⚠️', msg)
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:8080"],
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            // Allow Font Awesome fonts via jsDelivr
            // (required after switching CDN in delhi-advanced.html)
            // Note: adding here ensures webfonts load without CSP violations
            // while keeping other directives intact
            //
            // If you prefer a single array, merge the entry above instead of appending.
            connectSrc: [
                "'self'",
                "ws:",
                "wss:",
                "https://tile.openstreetmap.org",
                "https://a.tile.openstreetmap.org",
                "https://b.tile.openstreetmap.org",
                "https://c.tile.openstreetmap.org",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com"
            ]
        },
    },
}));

app.use(compression());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:8080"],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve static files from css and js directories
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use('/icons', express.static('icons'));

// Mock data storage (for demo purposes)
let mockBuses = [];
let mockRoutes = [];
let mockStops = [];

// Initialize mock data
function initializeMockData() {
    // Initialize buses
    for (let i = 0; i < 25; i++) {
        mockBuses.push({
            id: i + 1,
            busNumber: `DL${Math.floor(Math.random() * 100) + 10}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            route: `Route ${Math.floor(Math.random() * 50) + 1}`,
            lat: 28.6139 + (Math.random() - 0.5) * 0.2,
            lng: 77.2090 + (Math.random() - 0.5) * 0.2,
            nextStop: `Stop ${Math.floor(Math.random() * 100) + 1}`,
            eta: Math.floor(Math.random() * 15) + 1,
            speed: Math.floor(Math.random() * 60) + 20,
            status: ['running', 'stopped', 'delayed'][Math.floor(Math.random() * 3)]
        });
    }

    // Initialize routes
    for (let i = 0; i < 15; i++) {
        mockRoutes.push({
            id: i + 1,
            name: `Route ${i + 1}`,
            stops: [`Stop ${Math.floor(Math.random() * 50) + 1}`, `Stop ${Math.floor(Math.random() * 50) + 1}`, `Stop ${Math.floor(Math.random() * 50) + 1}`]
        });
    }

    // Initialize stops
    for (let i = 0; i < 50; i++) {
        mockStops.push({
            id: i + 1,
            name: `Stop ${i + 1}`,
            lat: 28.6139 + (Math.random() - 0.5) * 0.3,
            lng: 77.2090 + (Math.random() - 0.5) * 0.3,
            routes: [`Route ${Math.floor(Math.random() * 15) + 1}`, `Route ${Math.floor(Math.random() * 15) + 1}`]
        });
    }
}

// Initialize data
initializeMockData();


// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.2.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Bus statistics endpoint
app.get('/api/buses/stats', (req, res) => {
    res.json({
        activeBuses: Math.floor(Math.random() * 50) + 100,
        passengers: Math.floor(Math.random() * 1000) + 5000,
        avgDelay: Math.floor(Math.random() * 10) + 2,
        activeRoutes: Math.floor(Math.random() * 20) + 30
    });
});

// Bus locations endpoint
app.get('/api/buses/locations', (req, res) => {
    res.json(mockBuses);
});

// Routes endpoint
app.get('/api/routes', (req, res) => {
    res.json(mockRoutes);
});

// Stops endpoint
app.get('/api/stops', (req, res) => {
    res.json(mockStops);
});

// Serve frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delhi Bus Tracker Pro - Server</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #2a2d47 100%);
            color: white;
            font-family: 'Inter', sans-serif;
            padding: 50px 0;
        }
        .container {
            max-width: 800px;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        }
        .btn-primary {
            background: linear-gradient(135deg, #1a237e, #3f51b5);
            border: none;
            padding: 12px 30px;
            font-size: 18px;
        }
        a {
            color: #3f51b5;
            text-decoration: none;
        }
        a:hover {
            color: #1a237e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="text-center mb-5">
            <h1 class="display-4">🚌 Delhi Bus Tracker Pro</h1>
            <p class="lead">Advanced Real-Time GPS Tracking System</p>
            <p class="text-muted">Server running on port ${process.env.PORT || 3000}</p>
        </div>
        <div class="text-center mb-4">
            <a href="/delhi-advanced.html" class="btn btn-primary btn-lg">
                <i class="fas fa-bus me-2"></i>Launch Bus Tracker App
            </a>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="card p-4 mb-3">
                    <h4>📊 API Endpoints</h4>
                    <ul class="list-unstyled">
                        <li><a href="/api/health" target="_blank">/api/health</a> - Health check</li>
                        <li><a href="/api/buses/stats" target="_blank">/api/buses/stats</a> - Live statistics</li>
                        <li><a href="/api/buses/locations" target="_blank">/api/buses/locations</a> - Bus locations</li>
                        <li><a href="/api/routes" target="_blank">/api/routes</a> - Available routes</li>
                        <li><a href="/api/stops" target="_blank">/api/stops</a> - Bus stops</li>
                    </ul>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card p-4 mb-3">
                    <h4>🚀 Features</h4>
                    <ul class="list-unstyled">
                        <li>🚌 Real-time GPS tracking</li>
                        <li>📱 Progressive Web App</li>
                        <li>🌐 Multi-language support</li>
                        <li>🔔 Smart notifications</li>
                        <li>📊 Analytics dashboard</li>
                        <li>🔄 WebSocket updates</li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="text-center text-muted mt-4">
            <small>Delhi Bus Tracker Pro v1.2.0 | © 2024 Delhi Transport Corporation</small>
        </div>
    </div>
</body>
</html>
    `);
});

// Catch all handler for SPA routing
app.get('/delhi-advanced.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'delhi-advanced.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🚌 New client connected:', socket.id);

    // Send initial data
    socket.emit('initialData', {
        buses: mockBuses.slice(0, 10), // Send first 10 buses
        routes: mockRoutes,
        timestamp: new Date().toISOString()
    });

    // Handle bus tracking requests
    socket.on('trackBus', (busId) => {
        console.log('📍 Tracking bus:', busId);
        const bus = mockBuses.find(b => b.id === busId);
        if (bus) {
            socket.emit('busUpdate', bus);
        }
    });

    socket.on('trackRoute', (routeId) => {
        console.log('🛣️ Tracking route:', routeId);
        const route = mockRoutes.find(r => r.id === routeId);
        if (route) {
            socket.emit('routeUpdate', route);
        }
    });

    // Simulate real-time updates
    const updateInterval = setInterval(() => {
        // Update bus positions randomly
        mockBuses.forEach(bus => {
            bus.lat += (Math.random() - 0.5) * 0.001;
            bus.lng += (Math.random() - 0.5) * 0.001;
            bus.eta = Math.max(1, Math.floor(Math.random() * 15) + 1);
            bus.speed = Math.floor(Math.random() * 60) + 20;
        });

        socket.emit('locationUpdate', {
            buses: mockBuses,
            timestamp: new Date().toISOString()
        });
    }, 5000);

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        clearInterval(updateInterval);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 3000;

// Only start the HTTP server when this file is executed directly.
// When running on Netlify (serverless), this module is imported by
// `netlify/functions/server.js`, so we must avoid binding to a port.
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\n🚀 Delhi Bus Tracker Pro Server Started!`);
        console.log(`📍 Server running on: http://localhost:${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📱 PWA ready for installation`);
        console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📊 API endpoints available at /api/*`);
        console.log(`🚌 WebSocket server active for real-time updates`);
        console.log(`🎯 Main app: http://localhost:${PORT}/delhi-advanced.html`);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

module.exports = { app, io };
