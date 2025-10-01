# 🚌 Delhi Bus Tracker Pro - Advanced Real-Time Transit System

A comprehensive, feature-rich real-time bus tracking system for Delhi Transport Corporation with GPS tracking, ETA calculation, advanced analytics, user authentication, PWA capabilities, and multi-language support.

## 🌟 New Enhanced Features

### 🔔 Real-Time Notifications System
- **Smart Arrival Alerts**: Get notified when your bus is approaching
- **Delay Notifications**: Real-time updates about service delays
- **Route Updates**: Instant notifications about route changes
- **Customizable Settings**: Control what notifications you receive
- **Sound & Visual Alerts**: Multiple notification types with sound effects
- **Desktop Notifications**: Browser-based push notifications

### 📊 Advanced Analytics Dashboard
- **Live Performance Metrics**: Real-time ridership, on-time performance, and revenue tracking
- **Interactive Charts**: Beautiful visualizations using Chart.js
- **Route Efficiency Analysis**: Detailed performance metrics for each route
- **Historical Data**: Trends and patterns over time
- **Export Functionality**: Download analytics data in JSON format
- **Real-Time Updates**: Live metrics that update every few seconds

### 👤 User Authentication & Personalization
- **Multi-Method Login**: Email, Google, and phone number authentication
- **User Profiles**: Personalized experience with preferences
- **Favorite Routes**: Save and quick-access frequently used routes
- **Travel History**: Track your journey history and patterns
- **Preference Management**: Customize notifications, language, and display settings
- **Social Login**: Quick authentication via Google and other providers

### 📱 Progressive Web App (PWA)
- **Offline Functionality**: Works without internet connection
- **App-like Experience**: Install on mobile devices and desktop
- **Background Sync**: Sync data when connection is restored
- **Push Notifications**: Native mobile notifications
- **Fast Loading**: Cached resources for instant loading
- **Responsive Design**: Optimized for all screen sizes

### 🌐 Multi-Language Support
- **4 Languages**: English, Hindi (हिंदी), Urdu (اردو), Punjabi (ਪੰਜਾਬੀ)
- **RTL Support**: Right-to-left text for Urdu and Arabic
- **Localized Numbers**: Currency and number formatting per locale
- **Dynamic Translation**: Switch languages without page reload
- **Cultural Adaptation**: Region-specific date/time formats

## Features

### Core Functionality
- **Real-time GPS tracking** - Live location updates from driver apps
- **ETA calculation** - Smart arrival time prediction using live + historical data
- **Fare calculation** - Distance-based fare calculation with discounts
- **Route management** - Complete route and stop management system
- **Trip monitoring** - Real-time trip tracking and analytics

### User Management
- **Multi-role authentication** - Passenger, Driver, Admin roles
- **JWT-based security** - Secure token-based authentication
- **Profile management** - User preferences and settings

### Communication
- **WebSocket real-time updates** - Live location and ETA updates
- **SMS gateway integration** - Feature phone support via Twilio
- **Push notifications** - Firebase-based mobile notifications
- **Multi-language support** - Hindi and regional language support

### Admin Features
- **Fleet management** - Bus and driver management
- **Analytics dashboard** - Performance metrics and reports
- **Alert management** - System alerts and notifications
- **User management** - User roles and permissions

### Security & Compliance
- **Data encryption** - Sensitive data protection
- **Rate limiting** - API protection against abuse
- **GDPR compliance** - Data privacy and user rights
- **Security headers** - Protection against common attacks

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- Redis (optional, for caching)

### Installation

1. **Clone and install dependencies**
```bash
cd codechef
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB** (if not using Docker)
```bash
# Windows
mongod --dbpath C:\data\db

# Linux/Mac
sudo systemctl start mongod
```

4. **Seed the database**
```bash
npm run seed
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### GPS & Location
- `POST /api/gps/location` - Update bus location (Driver)
- `GET /api/gps/location/:busId` - Get bus location
- `GET /api/gps/locations/active` - Get all active bus locations

### Buses
- `GET /api/buses` - Get all buses
- `GET /api/buses/:busId` - Get bus details
- `GET /api/buses/:busId/eta/:stopId` - Get ETA to stop
- `GET /api/buses/stop/:stopId/buses` - Get buses at stop

### Passengers
- `GET /api/passengers/stops/search` - Search stops
- `GET /api/passengers/stops/:stopId/eta` - Get ETA at stop
- `GET /api/passengers/fare` - Calculate fare
- `GET /api/passengers/routes` - Find routes between stops
- `GET /api/passengers/nearby` - Get nearby stops and routes

### Drivers
- `GET /api/drivers/dashboard` - Driver dashboard
- `POST /api/drivers/trips/start` - Start trip
- `POST /api/drivers/trips/end` - End trip
- `POST /api/drivers/alerts` - Report alert

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/fleet` - Fleet management
- `GET /api/admin/drivers` - Driver management
- `GET /api/admin/analytics/performance` - Performance analytics

### SMS
- `POST /api/sms/webhook` - SMS webhook (Twilio)
- `POST /api/sms/send-eta` - Send ETA via SMS

## Sample Data

After running `npm run seed`, you'll have:

### Sample Accounts
- **Admin**: admin@bustrack.com / admin123
- **Driver 1**: ramesh.driver@bustrack.com / driver123  
- **Driver 2**: suresh.driver@bustrack.com / driver123
- **Passenger**: priya@example.com / passenger123

### Sample Routes
- **Route 12A**: Station → Market → College
- **Route 5B**: Depot → Hospital → Market

### Sample Buses
- **Bus 12A**: Active, assigned to Route 12A
- **Bus 5B**: Active, assigned to Route 5B
- **Bus 9C**: Under maintenance

## SMS Commands

Send SMS to your Twilio number:

- `ETA Station` - Get bus arrival times at Station
- `FARE Station TO College` - Calculate fare between stops
- `ROUTE Market TO Hospital` - Find routes between stops
- `HELP` - Get help message

## WebSocket Events

### Client → Server
- `trackBus` - Track specific bus
- `trackRoute` - Track route updates
- `trackGeneral` - General updates

### Server → Client
- `locationUpdate` - Bus location update
- `etaUpdate` - ETA update
- `alert` - System alert
- `tripUpdate` - Trip status update

## Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bus_tracker

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
BCRYPT_ROUNDS=12

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase)
FCM_SERVER_KEY=your_fcm_key
FIREBASE_PROJECT_ID=your_project_id

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Development

### Project Structure
```
codechef/
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
├── middleware/      # Express middleware
├── utils/           # Utility functions
├── scripts/         # Database scripts
├── logs/            # Application logs
└── public/          # Static files
```

### Running Tests
```bash
npm test
```

### Code Style
```bash
npm run lint
```

## Deployment

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d --build

# Scale API instances
docker-compose up -d --scale api=3
```

### Manual Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring and logging

## Monitoring

### Health Check
- `GET /api/health` - System health status

### Logs
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Access logs: Via middleware

### Metrics
- Connected WebSocket clients
- API response times
- Database query performance
- GPS update frequency

## Security

### Features Implemented
- JWT authentication with role-based access
- Input validation and sanitization
- Rate limiting on all endpoints
- Security headers (HSTS, CSP, etc.)
- Data encryption for sensitive information
- GDPR compliance helpers

### Best Practices
- Use HTTPS in production
- Regular security updates
- Monitor for suspicious activity
- Backup data regularly
- Implement proper logging

## Support

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongod --version
sudo systemctl status mongod
```

**Port Already in Use**
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process
taskkill /PID <PID> /F
```

**SMS Not Working**
- Verify Twilio credentials in `.env`
- Check Twilio webhook URL configuration
- Ensure phone number format is correct

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License
MIT License - see LICENSE file for details
