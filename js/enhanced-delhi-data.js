// Enhanced Delhi Bus System with More Realistic Data
const ENHANCED_DELHI_DATA = {
    center: [28.6139, 77.2090],
    
    // Comprehensive Delhi locations with exact coordinates
    locations: {
        // Central Delhi
        'Red Fort': [28.6562, 77.2410],
        'Chandni Chowk': [28.6506, 77.2334],
        'Jama Masjid': [28.6507, 77.2334],
        'Delhi Gate': [28.6418, 77.2394],
        'Kashmere Gate': [28.6677, 77.2273],
        'Civil Lines': [28.6778, 77.2273],
        'Tis Hazari': [28.6739, 77.2273],
        
        // Connaught Place Area
        'Connaught Place': [28.6315, 77.2167],
        'Rajiv Chowk': [28.6328, 77.2197],
        'Barakhamba Road': [28.6254, 77.2426],
        'Mandi House': [28.6254, 77.2426],
        'ITO': [28.6280, 77.2492],
        'Pragati Maidan': [28.6254, 77.2426],
        
        // South Delhi
        'India Gate': [28.6129, 77.2295],
        'Khan Market': [28.5984, 77.2295],
        'Lodhi Road': [28.5918, 77.2295],
        'AIIMS': [28.5672, 77.2100],
        'Safdarjung': [28.5672, 77.2100],
        'Green Park': [28.5594, 77.2066],
        'Hauz Khas': [28.5494, 77.2066],
        'Malviya Nagar': [28.5244, 77.2066],
        'Saket': [28.5244, 77.2066],
        'Qutub Minar': [28.5244, 77.1855],
        'Vasant Kunj': [28.5200, 77.1591],
        'Vasant Vihar': [28.5577, 77.1591],
        
        // West Delhi
        'Karol Bagh': [28.6519, 77.1909],
        'Patel Nagar': [28.6519, 77.1674],
        'Rajouri Garden': [28.6692, 77.1174],
        'Tagore Garden': [28.6431, 77.1174],
        'Subhash Nagar': [28.6431, 77.1174],
        'Tilak Nagar': [28.6431, 77.0814],
        'Janakpuri': [28.6219, 77.0814],
        'Uttam Nagar': [28.6219, 77.0460],
        'Dwarka': [28.5921, 77.0460],
        'Dwarka Sector 21': [28.5921, 77.0460],
        
        // North Delhi
        'Rohini': [28.7041, 77.1025],
        'Pitampura': [28.6947, 77.1025],
        'Shalimar Bagh': [28.6947, 77.1674],
        'Azadpur': [28.7041, 77.1674],
        'Model Town': [28.7041, 77.1909],
        'GTB Nagar': [28.6947, 77.2167],
        
        // East Delhi
        'Laxmi Nagar': [28.6355, 77.2774],
        'Preet Vihar': [28.6355, 77.2774],
        'Anand Vihar': [28.6469, 77.3150],
        'Karkardooma': [28.6469, 77.2774],
        'Shahdara': [28.6677, 77.2774],
        'Dilshad Garden': [28.6831, 77.3150],
        
        // South East Delhi
        'Lajpat Nagar': [28.5677, 77.2436],
        'Nehru Place': [28.5494, 77.2500],
        'Kalkaji': [28.5355, 77.2500],
        'Govindpuri': [28.5355, 77.2500],
        'Okhla': [28.5355, 77.2774],
        'Jamia Millia': [28.5616, 77.2774],
        
        // Airport & Outskirts
        'IGI Airport T1': [28.5665, 77.1031],
        'IGI Airport T3': [28.5562, 77.0999],
        'Mahipalpur': [28.5562, 77.1174],
        'Gurgaon Border': [28.4595, 77.0266],
        'Noida Border': [28.5355, 77.3910],
        'Faridabad Border': [28.4089, 77.3178]
    },
    
    // Comprehensive DTC Routes
    routes: {
        'DTC-001': {
            name: 'Red Fort - India Gate Circle',
            stops: ['Red Fort', 'Chandni Chowk', 'Kashmere Gate', 'Connaught Place', 'Barakhamba Road', 'India Gate'],
            color: '#e74c3c',
            fare: 15,
            frequency: '4-6 min',
            distance: '12 km',
            operatingHours: '05:00 - 23:30'
        },
        'DTC-181': {
            name: 'Karol Bagh - Nehru Place Express',
            stops: ['Karol Bagh', 'Patel Nagar', 'Connaught Place', 'ITO', 'Lajpat Nagar', 'Nehru Place'],
            color: '#3498db',
            fare: 20,
            frequency: '5-8 min',
            distance: '18 km',
            operatingHours: '05:30 - 23:00'
        },
        'DTC-764': {
            name: 'Dwarka - Connaught Place Metro Feeder',
            stops: ['Dwarka', 'Uttam Nagar', 'Janakpuri', 'Tilak Nagar', 'Rajouri Garden', 'Karol Bagh', 'Connaught Place'],
            color: '#2ecc71',
            fare: 25,
            frequency: '6-10 min',
            distance: '28 km',
            operatingHours: '05:00 - 00:00'
        },
        'DTC-543': {
            name: 'Rohini - Old Delhi Heritage Route',
            stops: ['Rohini', 'Pitampura', 'Model Town', 'GTB Nagar', 'Kashmere Gate', 'Chandni Chowk', 'Red Fort', 'Jama Masjid'],
            color: '#f39c12',
            fare: 18,
            frequency: '8-12 min',
            distance: '22 km',
            operatingHours: '06:00 - 22:30'
        },
        'DTC-615': {
            name: 'Airport - South Delhi Connector',
            stops: ['IGI Airport T3', 'Mahipalpur', 'Vasant Kunj', 'Vasant Vihar', 'AIIMS', 'Green Park', 'Hauz Khas', 'Saket'],
            color: '#9b59b6',
            fare: 30,
            frequency: '10-15 min',
            distance: '25 km',
            operatingHours: '04:30 - 01:00'
        },
        'DTC-405': {
            name: 'Anand Vihar - Connaught Place',
            stops: ['Anand Vihar', 'Preet Vihar', 'Laxmi Nagar', 'Shahdara', 'Kashmere Gate', 'Civil Lines', 'Connaught Place'],
            color: '#e67e22',
            fare: 22,
            frequency: '7-10 min',
            distance: '20 km',
            operatingHours: '05:15 - 23:15'
        },
        'DTC-729': {
            name: 'Noida Border - Khan Market',
            stops: ['Noida Border', 'Anand Vihar', 'Laxmi Nagar', 'ITO', 'Barakhamba Road', 'Khan Market', 'Lodhi Road'],
            color: '#1abc9c',
            fare: 25,
            frequency: '8-12 min',
            distance: '24 km',
            operatingHours: '05:45 - 22:45'
        }
    },
    
    // More realistic live bus data
    liveBuses: [
        {
            id: 'DL1PC9876',
            route: 'DTC-001',
            driver: 'Rajesh Kumar Singh',
            conductor: 'Mohan Lal',
            currentStop: 'Chandni Chowk',
            nextStop: 'Kashmere Gate',
            position: [28.6506, 77.2334],
            speed: 25,
            passengers: 42,
            capacity: 60,
            status: 'running',
            delay: 0,
            eta: 4,
            lastUpdated: new Date(),
            fuelLevel: 75,
            temperature: 28,
            ac: true,
            wheelchair: true
        },
        {
            id: 'DL1PC5432',
            route: 'DTC-181',
            driver: 'Suresh Singh Chauhan',
            conductor: 'Ram Prakash',
            currentStop: 'Connaught Place',
            nextStop: 'ITO',
            position: [28.6315, 77.2167],
            speed: 0,
            passengers: 38,
            capacity: 55,
            status: 'stopped',
            delay: 2,
            eta: 6,
            lastUpdated: new Date(),
            fuelLevel: 60,
            temperature: 30,
            ac: true,
            wheelchair: false
        },
        {
            id: 'DL1PC7890',
            route: 'DTC-764',
            driver: 'Amit Sharma',
            conductor: 'Vijay Kumar',
            currentStop: 'Rajouri Garden',
            nextStop: 'Karol Bagh',
            position: [28.6692, 77.1174],
            speed: 35,
            passengers: 29,
            capacity: 50,
            status: 'running',
            delay: -1,
            eta: 8,
            lastUpdated: new Date(),
            fuelLevel: 85,
            temperature: 26,
            ac: true,
            wheelchair: true
        },
        {
            id: 'DL1PC2468',
            route: 'DTC-543',
            driver: 'Vikram Yadav',
            conductor: 'Ashok Gupta',
            currentStop: 'Kashmere Gate',
            nextStop: 'Chandni Chowk',
            position: [28.6677, 77.2273],
            speed: 15,
            passengers: 15,
            capacity: 45,
            status: 'running',
            delay: 3,
            eta: 2,
            lastUpdated: new Date(),
            fuelLevel: 40,
            temperature: 32,
            ac: false,
            wheelchair: false
        },
        {
            id: 'DL1PC1357',
            route: 'DTC-615',
            driver: 'Manoj Gupta',
            conductor: 'Ravi Shankar',
            currentStop: 'AIIMS',
            nextStop: 'Green Park',
            position: [28.5672, 77.2100],
            speed: 40,
            passengers: 33,
            capacity: 52,
            status: 'running',
            delay: 1,
            eta: 12,
            lastUpdated: new Date(),
            fuelLevel: 90,
            temperature: 24,
            ac: true,
            wheelchair: true
        },
        {
            id: 'DL1PC8642',
            route: 'DTC-405',
            driver: 'Deepak Verma',
            conductor: 'Sanjay Kumar',
            currentStop: 'Laxmi Nagar',
            nextStop: 'Shahdara',
            position: [28.6355, 77.2774],
            speed: 30,
            passengers: 48,
            capacity: 55,
            status: 'running',
            delay: 0,
            eta: 5,
            lastUpdated: new Date(),
            fuelLevel: 65,
            temperature: 29,
            ac: true,
            wheelchair: false
        },
        {
            id: 'DL1PC9753',
            route: 'DTC-729',
            driver: 'Anil Sharma',
            conductor: 'Mukesh Yadav',
            currentStop: 'ITO',
            nextStop: 'Barakhamba Road',
            position: [28.6280, 77.2492],
            speed: 20,
            passengers: 25,
            capacity: 50,
            status: 'running',
            delay: -2,
            eta: 3,
            lastUpdated: new Date(),
            fuelLevel: 55,
            temperature: 27,
            ac: true,
            wheelchair: true
        }
    ],
    
    // Real-time traffic data
    trafficData: {
        'Connaught Place': { level: 'heavy', avgSpeed: 15, incidents: 2 },
        'Karol Bagh': { level: 'moderate', avgSpeed: 25, incidents: 0 },
        'Chandni Chowk': { level: 'heavy', avgSpeed: 12, incidents: 1 },
        'ITO': { level: 'moderate', avgSpeed: 30, incidents: 0 },
        'Kashmere Gate': { level: 'light', avgSpeed: 35, incidents: 0 },
        'Rajouri Garden': { level: 'moderate', avgSpeed: 28, incidents: 1 },
        'Nehru Place': { level: 'heavy', avgSpeed: 18, incidents: 0 },
        'AIIMS': { level: 'moderate', avgSpeed: 22, incidents: 0 }
    },
    
    // Weather conditions
    weather: {
        temperature: 28,
        humidity: 65,
        visibility: 8.5,
        condition: 'Clear',
        windSpeed: 12,
        airQuality: 'Moderate',
        aqi: 156
    }
};
