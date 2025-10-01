// Bus data for the application
const busData = {
  "12A": { 
    id:"12A", 
    time:"06:10 AM", 
    route:"Station → College", 
    status:"On Route", 
    speed:"18 km/h", 
    dist:"0.6 km", 
    driver:"Ramesh • 98xxxxxx45", 
    eta:"3 min"
  },
  "5B": { 
    id:"5B", 
    time:"05:40 AM", 
    route:"Depot → Market", 
    status:"Delayed", 
    speed:"10 km/h", 
    dist:"3.2 km", 
    driver:"Anil • 98xxxxxx11", 
    eta:"10 min"
  },
  "9C": { 
    id:"9C", 
    time:"06:00 AM", 
    route:"East → Station", 
    status:"On Route", 
    speed:"22 km/h", 
    dist:"1.1 km", 
    driver:"Suresh • 98xxxxxx22", 
    eta:"5 min"
  },
  "AUTO33": { 
    id:"AUTO33", 
    time:"06:18 AM", 
    route:"Market → College (Shared)", 
    status:"Shared", 
    speed:"15 km/h", 
    dist:"0.4 km", 
    driver:"Vikram • 98xxxxxx33", 
    eta:"2 min"
  }
};

// Export for use in other modules
window.busData = busData;
