const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const Trip = require('../models/Trip');

// Sample data
const sampleStops = [
  {
    stopId: 'ST001',
    name: 'Central Station',
    nameTranslations: {
      hi: 'केंद्रीय स्टेशन',
      ta: 'மத்திய நிலையம்'
    },
    location: { latitude: 28.6139, longitude: 77.2090 },
    address: 'New Delhi Railway Station, Delhi',
    landmarks: ['Railway Station', 'Metro Station'],
    amenities: ['shelter', 'seating', 'lighting', 'cctv'],
    stopType: 'terminal'
  },
  {
    stopId: 'ST002',
    name: 'Market Square',
    nameTranslations: {
      hi: 'बाज़ार चौक',
      ta: 'சந்தை சதுக்கம்'
    },
    location: { latitude: 28.6289, longitude: 77.2065 },
    address: 'Connaught Place, Delhi',
    landmarks: ['Shopping Mall', 'Bank'],
    amenities: ['shelter', 'seating', 'lighting'],
    stopType: 'regular'
  },
  {
    stopId: 'ST003',
    name: 'City College',
    nameTranslations: {
      hi: 'शहर कॉलेज',
      ta: 'நகர கல்லூரி'
    },
    location: { latitude: 28.6448, longitude: 77.2167 },
    address: 'Delhi University, North Campus',
    landmarks: ['University', 'Library'],
    amenities: ['shelter', 'seating', 'wheelchair_accessible'],
    stopType: 'regular'
  },
  {
    stopId: 'ST004',
    name: 'Hospital Junction',
    nameTranslations: {
      hi: 'अस्पताल चौराहा',
      ta: 'மருத்துவமனை சந்திப்பு'
    },
    location: { latitude: 28.6304, longitude: 77.2177 },
    address: 'AIIMS, Delhi',
    landmarks: ['AIIMS Hospital', 'Medical College'],
    amenities: ['shelter', 'seating', 'lighting', 'wheelchair_accessible'],
    stopType: 'regular'
  },
  {
    stopId: 'ST005',
    name: 'Bus Depot',
    nameTranslations: {
      hi: 'बस डिपो',
      ta: 'பேருந்து கிடங்கு'
    },
    location: { latitude: 28.6197, longitude: 77.2025 },
    address: 'DTC Depot, Kashmere Gate',
    landmarks: ['Bus Depot', 'Workshop'],
    amenities: ['shelter', 'restroom', 'parking'],
    stopType: 'depot'
  }
];

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@bustrack.com',
    phone: '9876543210',
    password: 'admin123',
    role: 'admin',
    preferredLanguage: 'en'
  },
  {
    name: 'Ramesh Kumar',
    email: 'ramesh.driver@bustrack.com',
    phone: '9876543211',
    password: 'driver123',
    role: 'driver',
    preferredLanguage: 'hi'
  },
  {
    name: 'Suresh Singh',
    email: 'suresh.driver@bustrack.com',
    phone: '9876543212',
    password: 'driver123',
    role: 'driver',
    preferredLanguage: 'hi'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543213',
    password: 'passenger123',
    role: 'passenger',
    preferredLanguage: 'en'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Bus.deleteMany({}),
      Route.deleteMany({}),
      Stop.deleteMany({}),
      Trip.deleteMany({})
    ]);

    console.log('Cleared existing data');

    // Create stops
    const stops = await Stop.insertMany(sampleStops);
    console.log(`Created ${stops.length} stops`);

    // Create users
    const users = await User.insertMany(sampleUsers);
    console.log(`Created ${users.length} users`);

    const drivers = users.filter(u => u.role === 'driver');

    // Create routes
    const sampleRoutes = [
      {
        routeNumber: '12A',
        name: 'Station to College Route',
        description: 'Connects Central Station to City College via Market Square',
        origin: stops[0]._id, // Central Station
        destination: stops[2]._id, // City College
        stops: [
          { stop: stops[0]._id, sequence: 1, distanceFromOrigin: 0, estimatedTravelTime: 0 },
          { stop: stops[1]._id, sequence: 2, distanceFromOrigin: 2.1, estimatedTravelTime: 8 },
          { stop: stops[2]._id, sequence: 3, distanceFromOrigin: 4.5, estimatedTravelTime: 18 }
        ],
        totalDistance: 4.5,
        estimatedDuration: 18,
        operatingHours: { start: '06:00', end: '22:00' },
        frequency: 15,
        fareStructure: {
          baseFare: 10,
          perKmRate: 3,
          maxFare: 25
        },
        averageSpeed: 25
      },
      {
        routeNumber: '5B',
        name: 'Depot to Market Route',
        description: 'Connects Bus Depot to Market Square via Hospital',
        origin: stops[4]._id, // Bus Depot
        destination: stops[1]._id, // Market Square
        stops: [
          { stop: stops[4]._id, sequence: 1, distanceFromOrigin: 0, estimatedTravelTime: 0 },
          { stop: stops[3]._id, sequence: 2, distanceFromOrigin: 1.8, estimatedTravelTime: 7 },
          { stop: stops[1]._id, sequence: 3, distanceFromOrigin: 3.2, estimatedTravelTime: 12 }
        ],
        totalDistance: 3.2,
        estimatedDuration: 12,
        operatingHours: { start: '05:30', end: '23:00' },
        frequency: 20,
        fareStructure: {
          baseFare: 8,
          perKmRate: 2.5,
          maxFare: 20
        },
        averageSpeed: 22
      }
    ];

    const routes = await Route.insertMany(sampleRoutes);
    console.log(`Created ${routes.length} routes`);

    // Create buses
    const sampleBuses = [
      {
        busNumber: '12A',
        registrationNumber: 'DL01AB1234',
        capacity: 45,
        type: 'city',
        status: 'active',
        assignedRoute: routes[0]._id,
        assignedDriver: drivers[0]._id,
        features: ['gps', 'cctv'],
        fuelType: 'diesel',
        currentLocation: {
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: 5,
          timestamp: new Date(),
          speed: 0,
          heading: 0
        },
        isOnline: false
      },
      {
        busNumber: '5B',
        registrationNumber: 'DL01CD5678',
        capacity: 40,
        type: 'city',
        status: 'active',
        assignedRoute: routes[1]._id,
        assignedDriver: drivers[1]._id,
        features: ['gps', 'wheelchair_accessible'],
        fuelType: 'cng',
        currentLocation: {
          latitude: 28.6197,
          longitude: 77.2025,
          accuracy: 5,
          timestamp: new Date(),
          speed: 0,
          heading: 0
        },
        isOnline: false
      },
      {
        busNumber: '9C',
        registrationNumber: 'DL01EF9012',
        capacity: 50,
        type: 'express',
        status: 'maintenance',
        features: ['ac', 'wifi', 'gps'],
        fuelType: 'diesel'
      }
    ];

    const buses = await Bus.insertMany(sampleBuses);
    console.log(`Created ${buses.length} buses`);

    // Create sample trips
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const sampleTrips = [
      {
        tripId: `TRIP_${Date.now()}_1`,
        bus: buses[0]._id,
        route: routes[0]._id,
        driver: drivers[0]._id,
        scheduledStartTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        scheduledEndTime: new Date(now.getTime() + 90 * 60 * 1000), // 1.5 hours from now
        status: 'scheduled',
        stopProgress: [
          {
            stop: stops[0]._id,
            scheduledArrival: new Date(now.getTime() + 60 * 60 * 1000),
            scheduledDeparture: new Date(now.getTime() + 62 * 60 * 1000)
          },
          {
            stop: stops[1]._id,
            scheduledArrival: new Date(now.getTime() + 68 * 60 * 1000),
            scheduledDeparture: new Date(now.getTime() + 70 * 60 * 1000)
          },
          {
            stop: stops[2]._id,
            scheduledArrival: new Date(now.getTime() + 78 * 60 * 1000),
            scheduledDeparture: new Date(now.getTime() + 80 * 60 * 1000)
          }
        ]
      },
      {
        tripId: `TRIP_${Date.now()}_2`,
        bus: buses[1]._id,
        route: routes[1]._id,
        driver: drivers[1]._id,
        scheduledStartTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        scheduledEndTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        status: 'scheduled',
        stopProgress: [
          {
            stop: stops[4]._id,
            scheduledArrival: new Date(now.getTime() + 30 * 60 * 1000),
            scheduledDeparture: new Date(now.getTime() + 32 * 60 * 1000)
          },
          {
            stop: stops[3]._id,
            scheduledArrival: new Date(now.getTime() + 37 * 60 * 1000),
            scheduledDeparture: new Date(now.getTime() + 39 * 60 * 1000)
          },
          {
            stop: stops[1]._id,
            scheduledArrival: new Date(now.getTime() + 42 * 60 * 1000),
            scheduledDeparture: new Date(now.getTime() + 44 * 60 * 1000)
          }
        ]
      }
    ];

    const trips = await Trip.insertMany(sampleTrips);
    console.log(`Created ${trips.length} trips`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample accounts created:');
    console.log('Admin: admin@bustrack.com / admin123');
    console.log('Driver 1: ramesh.driver@bustrack.com / driver123');
    console.log('Driver 2: suresh.driver@bustrack.com / driver123');
    console.log('Passenger: priya@example.com / passenger123');

    console.log('\nSample data:');
    console.log(`- ${stops.length} bus stops`);
    console.log(`- ${routes.length} routes`);
    console.log(`- ${buses.length} buses`);
    console.log(`- ${trips.length} scheduled trips`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
