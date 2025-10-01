// Real Delhi Bus System Data
const DELHI_DATA = {
    // Delhi center coordinates
    center: [28.6139, 77.2090],
    
    // Major Delhi locations with real coordinates
    locations: {
        'Red Fort': [28.6562, 77.2410],
        'India Gate': [28.6129, 77.2295],
        'Connaught Place': [28.6315, 77.2167],
        'Karol Bagh': [28.6519, 77.1909],
        'Chandni Chowk': [28.6506, 77.2334],
        'Rajouri Garden': [28.6692, 77.1174],
        'Lajpat Nagar': [28.5677, 77.2436],
        'Nehru Place': [28.5494, 77.2500],
        'Dwarka': [28.5921, 77.0460],
        'Rohini': [28.7041, 77.1025],
        'Janakpuri': [28.6219, 77.0814],
        'Saket': [28.5244, 77.2066],
        'Vasant Kunj': [28.5200, 77.1591],
        'Gurgaon Border': [28.4595, 77.0266],
        'Noida Border': [28.5355, 77.3910],
        'AIIMS': [28.5672, 77.2100],
        'ITO': [28.6280, 77.2492],
        'Kashmere Gate': [28.6677, 77.2273],
        'Anand Vihar': [28.6469, 77.3150],
        'Pragati Maidan': [28.6254, 77.2426]
    },
    
    // Real Delhi bus routes
    routes: {
        'DTC-001': {
            name: 'Red Fort - Connaught Place - India Gate',
            stops: ['Red Fort', 'Chandni Chowk', 'Kashmere Gate', 'Connaught Place', 'India Gate'],
            color: '#e74c3c',
            fare: 15,
            frequency: '5-8 min'
        },
        'DTC-181': {
            name: 'Karol Bagh - Connaught Place - Nehru Place',
            stops: ['Karol Bagh', 'Connaught Place', 'ITO', 'Lajpat Nagar', 'Nehru Place'],
            color: '#3498db',
            fare: 20,
            frequency: '6-10 min'
        },
        'DTC-764': {
            name: 'Dwarka - Rajouri Garden - Connaught Place',
            stops: ['Dwarka', 'Janakpuri', 'Rajouri Garden', 'Karol Bagh', 'Connaught Place'],
            color: '#2ecc71',
            fare: 25,
            frequency: '8-12 min'
        },
        'DTC-543': {
            name: 'Rohini - Kashmere Gate - Red Fort',
            stops: ['Rohini', 'Kashmere Gate', 'Chandni Chowk', 'Red Fort'],
            color: '#f39c12',
            fare: 18,
            frequency: '10-15 min'
        },
        'DTC-615': {
            name: 'Saket - AIIMS - Connaught Place',
            stops: ['Saket', 'Vasant Kunj', 'AIIMS', 'Connaught Place', 'India Gate'],
            color: '#9b59b6',
            fare: 22,
            frequency: '7-12 min'
        }
    },
    
    // Live bus data (simulated)
    liveBuses: [
        {
            id: 'DL1PC9876',
            route: 'DTC-001',
            driver: 'Rajesh Kumar',
            currentStop: 'Chandni Chowk',
            nextStop: 'Kashmere Gate',
            position: [28.6506, 77.2334],
            speed: 35,
            passengers: 42,
            capacity: 60,
            status: 'running',
            delay: 0,
            eta: 4
        },
        {
            id: 'DL1PC5432',
            route: 'DTC-181',
            driver: 'Suresh Singh',
            currentStop: 'Connaught Place',
            nextStop: 'ITO',
            position: [28.6315, 77.2167],
            speed: 28,
            passengers: 38,
            capacity: 55,
            status: 'running',
            delay: 2,
            eta: 6
        },
        {
            id: 'DL1PC7890',
            route: 'DTC-764',
            driver: 'Amit Sharma',
            currentStop: 'Rajouri Garden',
            nextStop: 'Karol Bagh',
            position: [28.6692, 77.1174],
            speed: 42,
            passengers: 29,
            capacity: 50,
            status: 'running',
            delay: -1,
            eta: 8
        },
        {
            id: 'DL1PC2468',
            route: 'DTC-543',
            driver: 'Vikram Yadav',
            currentStop: 'Kashmere Gate',
            nextStop: 'Chandni Chowk',
            position: [28.6677, 77.2273],
            speed: 0,
            passengers: 15,
            capacity: 45,
            status: 'stopped',
            delay: 3,
            eta: 2
        },
        {
            id: 'DL1PC1357',
            route: 'DTC-615',
            driver: 'Manoj Gupta',
            currentStop: 'AIIMS',
            nextStop: 'Connaught Place',
            position: [28.5672, 77.2100],
            speed: 38,
            passengers: 33,
            capacity: 52,
            status: 'running',
            delay: 1,
            eta: 12
        }
    ]
};

// Delhi Metro integration data
const DELHI_METRO = {
    stations: {
        'Rajiv Chowk': [28.6328, 77.2197],
        'Kashmere Gate': [28.6677, 77.2273],
        'Central Secretariat': [28.6142, 77.2122],
        'Karol Bagh': [28.6519, 77.1909],
        'Dwarka Sector 21': [28.5921, 77.0460],
        'Nehru Place': [28.5494, 77.2500]
    }
};

// Traffic and weather simulation
const CITY_CONDITIONS = {
    traffic: {
        level: 'moderate', // light, moderate, heavy
        areas: {
            'Connaught Place': 'heavy',
            'Karol Bagh': 'moderate',
            'Chandni Chowk': 'heavy',
            'ITO': 'moderate'
        }
    },
    weather: {
        condition: 'clear',
        temperature: 28,
        humidity: 65,
        visibility: 'good'
    }
};
