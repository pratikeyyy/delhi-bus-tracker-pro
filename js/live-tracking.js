// Live Bus Tracking System for Delhi
class DelhiBusTracker {
    constructor(mapId) {
        this.map = null;
        this.busMarkers = new Map();
        this.routeLines = new Map();
        this.selectedBus = null;
        this.updateInterval = null;
        this.visibleRoutes = null; // null = show all
        this.selectedBusFilterId = null; // if set, show only this bus
        this.initMap(mapId);
        this.startLiveUpdates();
    }

    initMap(mapId) {
        // Initialize map centered on Delhi
        this.map = L.map(mapId).setView(ENHANCED_DELHI_DATA.center, 11);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add Delhi locations
        this.addDelhiLocations();
        this.addBusRoutes();
        this.addLiveBuses();
    }

    addDelhiLocations() {
        Object.entries(ENHANCED_DELHI_DATA.locations).forEach(([name, coords]) => {
            const icon = L.divIcon({
                html: `<div class="location-marker">📍</div>`,
                className: 'custom-location',
                iconSize: [20, 20]
            });
            
            L.marker(coords, { icon })
                .bindPopup(`<b>${name}</b><br>Major Delhi Location`)
                .addTo(this.map);
        });
    }

    addBusRoutes() {
        Object.entries(ENHANCED_DELHI_DATA.routes).forEach(([routeId, route]) => {
            const routeCoords = route.stops.map(stop => ENHANCED_DELHI_DATA.locations[stop]);
            
            const routeLine = L.polyline(routeCoords, {
                color: route.color,
                weight: 4,
                opacity: 0.7
            }).addTo(this.map);

            routeLine.bindPopup(`
                <b>${route.name}</b><br>
                Route: ${routeId}<br>
                Fare: ₹${route.fare}<br>
                Frequency: ${route.frequency}
            `);

            this.routeLines.set(routeId, routeLine);
        });
    }

    addLiveBuses() {
        ENHANCED_DELHI_DATA.liveBuses.forEach(bus => {
            this.createBusMarker(bus);
        });
    }

    createBusMarker(bus) {
        const statusColor = {
            'running': '#00c853',
            'stopped': '#ff9800',
            'breakdown': '#f44336'
        };

        const icon = L.divIcon({
            html: `
                <div class="bus-marker" style="background: ${statusColor[bus.status]}">
                    🚌 ${bus.id.slice(-4)}
                </div>
            `,
            className: 'custom-bus-marker',
            iconSize: [80, 30]
        });

        const marker = L.marker(bus.position, { icon })
            .bindPopup(this.getBusPopupContent(bus))
            .addTo(this.map);

        marker.on('click', () => this.selectBus(bus));
        this.busMarkers.set(bus.id, marker);
    }

    getBusPopupContent(bus) {
        const route = ENHANCED_DELHI_DATA.routes[bus.route];
        return `
            <div class="bus-popup">
                <h6>🚌 ${bus.id}</h6>
                <div><strong>Route:</strong> ${route.name}</div>
                <div><strong>Driver:</strong> ${bus.driver}</div>
                <div><strong>Current:</strong> ${bus.currentStop}</div>
                <div><strong>Next:</strong> ${bus.nextStop} (${bus.eta} min)</div>
                <div><strong>Speed:</strong> ${bus.speed} km/h</div>
                <div><strong>Passengers:</strong> ${bus.passengers}/${bus.capacity}</div>
                <div><strong>Status:</strong> <span class="status-${bus.status}">${bus.status}</span></div>
                ${bus.delay !== 0 ? `<div><strong>Delay:</strong> ${bus.delay > 0 ? '+' : ''}${bus.delay} min</div>` : ''}
            </div>
        `;
    }

    selectBus(bus) {
        this.selectedBus = bus;
        this.updateBusDetails(bus);
        
        // Highlight selected bus route
        this.routeLines.forEach(line => line.setStyle({ weight: 4, opacity: 0.7 }));
        if (this.routeLines.has(bus.route)) {
            this.routeLines.get(bus.route).setStyle({ weight: 6, opacity: 1 });
        }
    }

    updateBusDetails(bus) {
        const route = ENHANCED_DELHI_DATA.routes[bus.route];
        document.getElementById('busDetails').innerHTML = `
            <div class="bus-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="mb-1">🚌 ${bus.id}</h6>
                        <div class="small-muted">Driver: ${bus.driver}</div>
                        <div class="small-muted">Route: ${route.name}</div>
                    </div>
                    <span class="badge-status status-${bus.status}">${bus.status}</span>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="small-muted">Current Location</div>
                        <div class="fw-bold">${bus.currentStop}</div>
                    </div>
                    <div class="col-6">
                        <div class="small-muted">Next Stop</div>
                        <div class="fw-bold">${bus.nextStop} (${bus.eta} min)</div>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-4">
                        <div class="small-muted">Speed</div>
                        <div class="fw-bold">${bus.speed} km/h</div>
                    </div>
                    <div class="col-4">
                        <div class="small-muted">Passengers</div>
                        <div class="fw-bold">${bus.passengers}/${bus.capacity}</div>
                    </div>
                    <div class="col-4">
                        <div class="small-muted">Fare</div>
                        <div class="fw-bold">₹${route.fare}</div>
                    </div>
                </div>
                ${bus.delay !== 0 ? `
                <div class="mt-2">
                    <div class="small-muted">Delay Status</div>
                    <div class="fw-bold ${bus.delay > 0 ? 'text-warning' : 'text-success'}">
                        ${bus.delay > 0 ? '+' : ''}${bus.delay} minutes
                    </div>
                </div>` : ''}
            </div>
        `;
    }

    startLiveUpdates() {
        this.updateInterval = setInterval(() => {
            this.simulateBusMovement();
            this.updateBusMarkers();
        }, 2000); // Update every 2 seconds for smoother movement
    }

    simulateBusMovement() {
        ENHANCED_DELHI_DATA.liveBuses.forEach(bus => {
            if (bus.status === 'running') {
                const route = ENHANCED_DELHI_DATA.routes[bus.route];
                const currentStopIndex = route.stops.indexOf(bus.currentStop);
                const nextStopIndex = route.stops.indexOf(bus.nextStop);
                
                if (currentStopIndex !== -1 && nextStopIndex !== -1) {
                    const currentStopCoords = ENHANCED_DELHI_DATA.locations[bus.currentStop];
                    const nextStopCoords = ENHANCED_DELHI_DATA.locations[bus.nextStop];
                    
                    // Calculate movement direction
                    const latDiff = nextStopCoords[0] - currentStopCoords[0];
                    const lngDiff = nextStopCoords[1] - currentStopCoords[1];
                    
                    // Move bus towards next stop
                    const moveSpeed = 0.0003; // Slightly faster for visible movement
                    bus.position[0] += latDiff * moveSpeed;
                    bus.position[1] += lngDiff * moveSpeed;
                    
                    // Check if bus reached next stop
                    const distanceToNext = Math.sqrt(
                        Math.pow(bus.position[0] - nextStopCoords[0], 2) + 
                        Math.pow(bus.position[1] - nextStopCoords[1], 2)
                    );
                    
                    if (distanceToNext < 0.001) {
                        // Bus reached next stop
                        bus.currentStop = bus.nextStop;
                        const newNextIndex = nextStopIndex + 1;
                        
                        if (newNextIndex < route.stops.length) {
                            bus.nextStop = route.stops[newNextIndex];
                            bus.eta = Math.floor(Math.random() * 8) + 3; // 3-10 minutes
                        } else {
                            // End of route, restart
                            bus.currentStop = route.stops[0];
                            bus.nextStop = route.stops[1];
                            bus.position = [...ENHANCED_DELHI_DATA.locations[route.stops[0]]];
                        }
                        
                        // Simulate passenger boarding/alighting at stops
                        const change = Math.floor((Math.random() - 0.3) * 15);
                        bus.passengers = Math.max(5, Math.min(bus.capacity, bus.passengers + change));
                    }
                }
                
                // Update realistic speed based on traffic
                const trafficArea = ENHANCED_DELHI_DATA.trafficData[bus.currentStop];
                if (trafficArea) {
                    bus.speed = trafficArea.avgSpeed + (Math.random() - 0.5) * 10;
                } else {
                    bus.speed = 25 + (Math.random() - 0.5) * 15;
                }
                bus.speed = Math.max(0, Math.min(60, bus.speed));
                
                // Update ETA based on distance and traffic
                if (Math.random() > 0.8) {
                    bus.eta = Math.max(1, bus.eta - 1);
                }
                
                // Random status changes
                if (Math.random() > 0.98) {
                    bus.status = bus.status === 'running' ? 'stopped' : 'running';
                    setTimeout(() => {
                        bus.status = 'running';
                    }, 10000); // Stop for 10 seconds
                }
            }
        });
    }

    updateBusMarkers() {
        ENHANCED_DELHI_DATA.liveBuses.forEach(bus => {
            const marker = this.busMarkers.get(bus.id);
            if (marker) {
                // Smooth marker movement
                const currentLatLng = marker.getLatLng();
                const newLatLng = L.latLng(bus.position[0], bus.position[1]);
                
                // Animate marker movement
                this.animateMarker(marker, currentLatLng, newLatLng);
                
                // Update popup content
                marker.getPopup().setContent(this.getBusPopupContent(bus));
                
                // Update bus icon based on status
                this.updateBusIcon(marker, bus);

                // Apply visibility filter
                if (this.selectedBusFilterId && this.selectedBusFilterId !== bus.id) {
                    marker.setOpacity(0);
                } else if (this.visibleRoutes && !this.visibleRoutes.has(bus.route)) {
                    marker.setOpacity(0);
                } else {
                    marker.setOpacity(1);
                }
                
                if (this.selectedBus && this.selectedBus.id === bus.id) {
                    this.updateBusDetails(bus);
                }
            }
        });
    }

    animateMarker(marker, startLatLng, endLatLng) {
        const duration = 1500; // 1.5 seconds animation
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const easeProgress = progress * (2 - progress);
            
            const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * easeProgress;
            const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * easeProgress;
            
            marker.setLatLng([lat, lng]);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    updateBusIcon(marker, bus) {
        const statusColor = {
            'running': '#00c853',
            'stopped': '#ff9800',
            'breakdown': '#f44336'
        };

        const icon = L.divIcon({
            html: `
                <div class="bus-marker" style="background: ${statusColor[bus.status]}; animation: ${bus.status === 'running' ? 'busMove 2s infinite' : 'none'}">
                    🚌 ${bus.id.slice(-4)}
                </div>
            `,
            className: 'custom-bus-marker',
            iconSize: [80, 30]
        });

        marker.setIcon(icon);
    }

    // Show only buses that serve a trip between from->to
    filterBusesByStops(from, to) {
        const allowedRoutes = new Set();
        Object.entries(ENHANCED_DELHI_DATA.routes).forEach(([routeId, route]) => {
            const i = route.stops.indexOf(from);
            const j = route.stops.indexOf(to);
            if (i !== -1 && j !== -1 && i < j) allowedRoutes.add(routeId);
        });
        this.applyRouteVisibility(allowedRoutes);
    }

    // Show only buses for routes that include the stop
    filterBusesByStop(stopName) {
        const allowedRoutes = new Set();
        Object.entries(ENHANCED_DELHI_DATA.routes).forEach(([routeId, route]) => {
            if (route.stops.includes(stopName)) allowedRoutes.add(routeId);
        });
        this.applyRouteVisibility(allowedRoutes);
    }

    // Reset visibility to show all
    showAllBuses() {
        this.applyRouteVisibility(null);
    }

    // Internal: apply visibility to markers and dim other polylines
    applyRouteVisibility(allowedRoutes) {
        this.visibleRoutes = allowedRoutes; // may be null
        this.busMarkers.forEach((marker, id) => {
            const bus = ENHANCED_DELHI_DATA.liveBuses.find(b => b.id === id);
            if (!bus) return;
            const show = !allowedRoutes || allowedRoutes.has(bus.route);
            marker.setOpacity(show ? 1 : 0);
        });

        // Emphasize allowed route lines
        this.routeLines.forEach((line, routeId) => {
            if (!allowedRoutes) {
                line.setStyle({ opacity: 0.7, weight: 4 });
            } else if (allowedRoutes.has(routeId)) {
                line.setStyle({ opacity: 1, weight: 6 });
            } else {
                line.setStyle({ opacity: 0.15, weight: 2 });
            }
        });

        // Zoom to selected routes if any
        if (allowedRoutes && allowedRoutes.size > 0) {
            this.focusOnRoutes(allowedRoutes);
        }
    }

    // Fit the map view to include all coordinates of the given routes
    focusOnRoutes(allowedRoutes) {
        const coords = [];
        allowedRoutes.forEach(routeId => {
            const route = ENHANCED_DELHI_DATA.routes[routeId];
            if (!route) return;
            route.stops.forEach(stop => {
                const c = ENHANCED_DELHI_DATA.locations[stop];
                if (c) coords.push(c);
            });
        });
        if (coords.length > 0) {
            this.map.fitBounds(coords, { padding: [30, 30] });
        }
    }

    // Convenience: focus by from->to pair
    focusByStops(from, to) {
        const allowedRoutes = new Set();
        Object.entries(ENHANCED_DELHI_DATA.routes).forEach(([routeId, route]) => {
            const i = route.stops.indexOf(from);
            const j = route.stops.indexOf(to);
            if (i !== -1 && j !== -1 && i < j) allowedRoutes.add(routeId);
        });
        if (allowedRoutes.size > 0) {
            this.focusOnRoutes(allowedRoutes);
        }
    }

    searchRoute(from, to) {
        const results = [];
        
        Object.entries(ENHANCED_DELHI_DATA.routes).forEach(([routeId, route]) => {
            const fromIndex = route.stops.indexOf(from);
            const toIndex = route.stops.indexOf(to);
            
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
                const distance = toIndex - fromIndex;
                const travelTime = distance * 8; // Approximate 8 min per stop
                
                results.push({
                    routeId,
                    routeName: route.name,
                    stops: route.stops.slice(fromIndex, toIndex + 1),
                    fare: Math.ceil(route.fare * distance / route.stops.length),
                    estimatedTime: travelTime,
                    frequency: route.frequency
                });
            }
        });
        
        return results;
    }

    getBusesAtStop(stopName) {
        const buses = [];
        
        ENHANCED_DELHI_DATA.liveBuses.forEach(bus => {
            const route = ENHANCED_DELHI_DATA.routes[bus.route];
            if (route.stops.includes(stopName)) {
                const stopIndex = route.stops.indexOf(stopName);
                const currentIndex = route.stops.indexOf(bus.currentStop);
                
                let eta = 0;
                if (currentIndex < stopIndex) {
                    eta = (stopIndex - currentIndex) * 8 + bus.eta;
                } else if (bus.currentStop === stopName) {
                    eta = 0;
                }
                
                buses.push({
                    ...bus,
                    eta: eta,
                    route: route
                });
            }
        });
        
        return buses.sort((a, b) => a.eta - b.eta);
    }

    stopLiveUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Route search functionality
function findRoute() {
    const from = document.getElementById('fromSelect').value;
    const to = document.getElementById('toSelect').value;
    
    if (!from || !to || from === to) {
        alert('Please select different origin and destination stops');
        return;
    }
    
    const routes = window.busTracker.searchRoute(from, to);
    displayRouteResults(routes, from, to);
    // Filter buses to relevant routes
    window.busTracker.filterBusesByStops(from, to);
    window.busTracker.focusByStops(from, to);
}

function trackRoute(routeId, from, to) {
    const route = ENHANCED_DELHI_DATA.routes[routeId];
    if (!route) return;
    
    const bus = ENHANCED_DELHI_DATA.liveBuses.find(b => b.route === routeId && route.stops.includes(b.currentStop));
    if (!bus) return;
    
    window.busTracker.filterBusesByStop(bus.currentStop);
    window.busTracker.focusOnRoutes(new Set([routeId]));
    window.busTracker.showBusETA(bus);
}

function displayRouteResults(routes, from, to) {
    const resultsDiv = document.getElementById('routeResults');
    
    if (routes.length === 0) {
        resultsDiv.innerHTML = `
            <div class="alert alert-warning">
                No direct routes found from ${from} to ${to}
            </div>
        `;
        return;
    }
    
    let html = `<h6>Routes from ${from} to ${to}:</h6>`;
    
    routes.forEach(route => {
        html += `
            <div class="route-result mb-3 p-3" style="border: 1px solid var(--border); border-radius: 8px;">
                <div class="d-flex justify-content-between">
                    <strong>${route.routeId}</strong>
                    <div class="d-flex gap-2 align-items-center">
                        <span class="text-success">₹${route.fare}</span>
                        <button class="btn btn-sm btn-primary" onclick="trackRoute('${route.routeId}','${from}','${to}')">Track Live</button>
                    </div>
                </div>
                <div class="small-muted">${route.routeName}</div>
                <div class="mt-2">
                    <div>🕒 ${route.estimatedTime} minutes</div>
                    <div>🚌 Every ${route.frequency}</div>
                    <div>📍 ${route.stops.length} stops</div>
                </div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
}

// Expose helper for Quick Action "Show All Buses"
function showAllBuses() {
    if (window.busTracker) window.busTracker.showAllBuses();
}

// Stop search functionality
function searchStop() {
    const stopName = document.getElementById('stopSearch').value;
    
    if (!stopName || !ENHANCED_DELHI_DATA.locations[stopName]) {
        return;
    }
    
    const buses = window.busTracker.getBusesAtStop(stopName);
    displayStopResults(buses, stopName);
    // Filter buses to this stop's routes
    window.busTracker.filterBusesByStop(stopName);
}

function displayStopResults(buses, stopName) {
    const resultsDiv = document.getElementById('stopResults');
    
    if (buses.length === 0) {
        resultsDiv.innerHTML = `
            <div class="alert alert-info">
                No buses currently serving ${stopName}
            </div>
        `;
        return;
    }
    
    let html = `<h6>Buses at ${stopName}:</h6>`;
    
    buses.forEach(bus => {
        html += `
            <div class="d-flex justify-content-between mb-2 p-2" style="border: 1px solid var(--border); border-radius: 6px;">
                <div>
                    <strong>${bus.route.name}</strong>
                    <div class="small-muted">${bus.id}</div>
                </div>
                <div class="text-end">
                    <div class="fw-bold ${bus.eta === 0 ? 'text-success' : 'text-warning'}">
                        ${bus.eta === 0 ? 'At Stop' : `${bus.eta} min`}
                    </div>
                    <div class="small-muted">${bus.passengers}/${bus.capacity}</div>
                </div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
}
