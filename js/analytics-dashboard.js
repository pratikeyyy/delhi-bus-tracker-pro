// Advanced Analytics Dashboard for Delhi Bus Tracker
class AnalyticsDashboard {
    constructor() {
        this.charts = new Map();
        this.metrics = {
            ridership: [],
            onTimePerformance: [],
            routeEfficiency: [],
            passengerSatisfaction: [],
            fuelConsumption: [],
            revenue: []
        };
        
        this.realTimeData = {
            totalPassengers: 0,
            averageDelay: 0,
            activeBuses: 0,
            completedTrips: 0,
            revenue: 0,
            fuelEfficiency: 0
        };

        this.init();
    }

    init() {
        this.createDashboard();
        this.generateSampleData();
        this.initializeCharts();
        this.startRealTimeUpdates();
    }

    createDashboard() {
        // Create analytics dashboard container
        const dashboardHTML = `
            <div id="analytics-dashboard" style="display: none;">
                <style>
                    .analytics-container {
                        background: var(--bg);
                        color: var(--text);
                        padding: 20px;
                        border-radius: 16px;
                        margin: 20px 0;
                    }
                    
                    .metric-card {
                        background: linear-gradient(135deg, var(--card), var(--card-hover));
                        border: 1px solid var(--border);
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .metric-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 12px 32px rgba(0,0,0,0.3);
                    }
                    
                    .metric-value {
                        font-size: 2.5rem;
                        font-weight: 700;
                        margin-bottom: 8px;
                        background: linear-gradient(45deg, var(--primary), var(--secondary));
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    .metric-label {
                        font-size: 0.9rem;
                        color: var(--text-muted);
                        margin-bottom: 4px;
                    }
                    
                    .metric-change {
                        font-size: 0.8rem;
                        font-weight: 600;
                    }
                    
                    .metric-change.positive {
                        color: var(--success);
                    }
                    
                    .metric-change.negative {
                        color: var(--danger);
                    }
                    
                    .chart-container {
                        background: var(--card);
                        border: 1px solid var(--border);
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                        height: 400px;
                    }
                    
                    .dashboard-header {
                        display: flex;
                        justify-content: between;
                        align-items: center;
                        margin-bottom: 30px;
                        padding: 20px;
                        background: var(--card);
                        border-radius: 12px;
                        border: 1px solid var(--border);
                    }
                    
                    .dashboard-controls {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    
                    .time-filter {
                        background: var(--muted);
                        border: 1px solid var(--border);
                        color: var(--text);
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                    }
                    
                    .time-filter.active {
                        background: var(--primary);
                        color: white;
                    }
                    
                    .analytics-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .chart-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    
                    @media (max-width: 768px) {
                        .chart-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                    
                    .export-btn {
                        background: var(--success);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    }
                    
                    .export-btn:hover {
                        background: #00a047;
                        transform: translateY(-2px);
                    }
                </style>
                
                <div class="analytics-container">
                    <div class="dashboard-header">
                        <div>
                            <h2>📊 Analytics Dashboard</h2>
                            <p class="text-muted mb-0">Real-time insights and performance metrics</p>
                        </div>
                        <div class="dashboard-controls">
                            <select class="time-filter" id="timeFilter" onchange="analytics.changeTimeFilter(this.value)">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month" selected>This Month</option>
                                <option value="year">This Year</option>
                            </select>
                            <button class="export-btn" onclick="analytics.exportData()">
                                📥 Export Data
                            </button>
                        </div>
                    </div>
                    
                    <!-- Key Metrics -->
                    <div class="analytics-grid">
                        <div class="metric-card">
                            <div class="metric-value" id="totalPassengers">12,847</div>
                            <div class="metric-label">Total Passengers</div>
                            <div class="metric-change positive" id="passengersChange">+12.5% from last month</div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-value" id="onTimePerformance">87.3%</div>
                            <div class="metric-label">On-Time Performance</div>
                            <div class="metric-change positive" id="performanceChange">+3.2% from last month</div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-value" id="averageDelay">2.4</div>
                            <div class="metric-label">Avg Delay (min)</div>
                            <div class="metric-change negative" id="delayChange">-0.8 min from last month</div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-value" id="revenue">₹2.8L</div>
                            <div class="metric-label">Revenue</div>
                            <div class="metric-change positive" id="revenueChange">+18.7% from last month</div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-value" id="fuelEfficiency">12.8</div>
                            <div class="metric-label">Fuel Efficiency (km/l)</div>
                            <div class="metric-change positive" id="fuelChange">+5.2% from last month</div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-value" id="customerSatisfaction">4.2</div>
                            <div class="metric-label">Customer Rating</div>
                            <div class="metric-change positive" id="satisfactionChange">+0.3 from last month</div>
                        </div>
                    </div>
                    
                    <!-- Charts -->
                    <div class="chart-grid">
                        <div class="chart-container">
                            <h5>📈 Ridership Trends</h5>
                            <canvas id="ridershipChart"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <h5>⏰ On-Time Performance</h5>
                            <canvas id="performanceChart"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <h5>🛣️ Route Efficiency</h5>
                            <canvas id="routeChart"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <h5>💰 Revenue Analysis</h5>
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Detailed Tables -->
                    <div class="chart-container" style="height: auto;">
                        <h5>🚌 Route Performance Details</h5>
                        <div class="table-responsive">
                            <table class="table table-dark table-striped">
                                <thead>
                                    <tr>
                                        <th>Route</th>
                                        <th>Passengers/Day</th>
                                        <th>On-Time %</th>
                                        <th>Avg Delay</th>
                                        <th>Revenue</th>
                                        <th>Rating</th>
                                    </tr>
                                </thead>
                                <tbody id="routeDetailsTable">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to the page
        const container = document.querySelector('.container-main');
        container.insertAdjacentHTML('beforeend', dashboardHTML);
    }

    generateSampleData() {
        // Generate realistic sample data for the last 30 days
        const days = 30;
        const today = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Ridership data (with weekly patterns)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseRidership = isWeekend ? 8000 : 12000;
            const ridership = baseRidership + (Math.random() - 0.5) * 2000;
            
            this.metrics.ridership.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(ridership)
            });
            
            // On-time performance
            const basePerformance = 85 + (Math.random() - 0.5) * 10;
            this.metrics.onTimePerformance.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(basePerformance * 10) / 10
            });
            
            // Revenue
            const revenue = ridership * (15 + Math.random() * 5); // Average fare 15-20
            this.metrics.revenue.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(revenue)
            });
        }
        
        // Route efficiency data
        Object.keys(ENHANCED_DELHI_DATA.routes).forEach(routeId => {
            const route = ENHANCED_DELHI_DATA.routes[routeId];
            this.metrics.routeEfficiency.push({
                route: routeId,
                name: route.name,
                efficiency: 75 + Math.random() * 20,
                passengers: Math.round(800 + Math.random() * 1200),
                onTime: 80 + Math.random() * 15,
                avgDelay: Math.random() * 5,
                revenue: Math.round(12000 + Math.random() * 8000),
                rating: 3.5 + Math.random() * 1.5
            });
        });
    }

    async initializeCharts() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }

        this.createRidershipChart();
        this.createPerformanceChart();
        this.createRouteChart();
        this.createRevenueChart();
        this.populateRouteTable();
    }

    async loadChartJS() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    createRidershipChart() {
        const ctx = document.getElementById('ridershipChart').getContext('2d');
        
        this.charts.set('ridership', new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.metrics.ridership.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Daily Passengers',
                    data: this.metrics.ridership.map(d => d.value),
                    borderColor: '#00c853',
                    backgroundColor: 'rgba(0, 200, 83, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#3a3f5c' }
                    },
                    y: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#3a3f5c' }
                    }
                }
            }
        }));
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        this.charts.set('performance', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['On Time', 'Slightly Late', 'Very Late'],
                datasets: [{
                    data: [87.3, 9.2, 3.5],
                    backgroundColor: ['#00c853', '#ff9800', '#f44336'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff' }
                    }
                }
            }
        }));
    }

    createRouteChart() {
        const ctx = document.getElementById('routeChart').getContext('2d');
        
        const routeData = this.metrics.routeEfficiency.slice(0, 6); // Top 6 routes
        
        this.charts.set('route', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: routeData.map(r => r.route),
                datasets: [{
                    label: 'Efficiency Score',
                    data: routeData.map(r => r.efficiency),
                    backgroundColor: '#3f51b5',
                    borderColor: '#1a237e',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#3a3f5c' }
                    },
                    y: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#3a3f5c' },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        }));
    }

    createRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        // Group revenue by week
        const weeklyRevenue = this.groupByWeek(this.metrics.revenue);
        
        this.charts.set('revenue', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyRevenue.map(w => w.week),
                datasets: [{
                    label: 'Weekly Revenue (₹)',
                    data: weeklyRevenue.map(w => w.value),
                    backgroundColor: 'rgba(255, 64, 129, 0.8)',
                    borderColor: '#ff4081',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#3a3f5c' }
                    },
                    y: {
                        ticks: { 
                            color: '#b0bec5',
                            callback: function(value) {
                                return '₹' + (value / 1000).toFixed(0) + 'K';
                            }
                        },
                        grid: { color: '#3a3f5c' }
                    }
                }
            }
        }));
    }

    populateRouteTable() {
        const tbody = document.getElementById('routeDetailsTable');
        tbody.innerHTML = '';
        
        this.metrics.routeEfficiency.forEach(route => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${route.route}</strong><br><small class="text-muted">${route.name}</small></td>
                <td>${route.passengers.toLocaleString()}</td>
                <td><span class="badge ${route.onTime > 85 ? 'bg-success' : route.onTime > 75 ? 'bg-warning' : 'bg-danger'}">${route.onTime.toFixed(1)}%</span></td>
                <td>${route.avgDelay.toFixed(1)} min</td>
                <td>₹${(route.revenue / 1000).toFixed(0)}K</td>
                <td>${'⭐'.repeat(Math.floor(route.rating))} ${route.rating.toFixed(1)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    groupByWeek(data) {
        const weeks = {};
        
        data.forEach(item => {
            const date = new Date(item.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    week: weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    value: 0
                };
            }
            weeks[weekKey].value += item.value;
        });
        
        return Object.values(weeks);
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.updateRealTimeMetrics();
        }, 5000); // Update every 5 seconds
    }

    updateRealTimeMetrics() {
        // Calculate real-time metrics from live bus data
        const activeBuses = ENHANCED_DELHI_DATA.liveBuses.filter(bus => bus.status === 'running').length;
        const totalPassengers = ENHANCED_DELHI_DATA.liveBuses.reduce((sum, bus) => sum + bus.passengers, 0);
        const avgDelay = ENHANCED_DELHI_DATA.liveBuses.reduce((sum, bus) => sum + Math.abs(bus.delay), 0) / ENHANCED_DELHI_DATA.liveBuses.length;
        
        // Update display
        document.getElementById('totalPassengers').textContent = totalPassengers.toLocaleString();
        document.getElementById('averageDelay').textContent = avgDelay.toFixed(1);
        
        // Simulate other metrics updates
        if (Math.random() > 0.8) {
            const currentRevenue = parseFloat(document.getElementById('revenue').textContent.replace('₹', '').replace('L', '')) * 100000;
            const newRevenue = currentRevenue + Math.random() * 1000;
            document.getElementById('revenue').textContent = '₹' + (newRevenue / 100000).toFixed(1) + 'L';
        }
    }

    changeTimeFilter(period) {
        console.log(`Changing time filter to: ${period}`);
        // In a real app, this would fetch new data based on the time period
        // For now, we'll just show a notification
        if (window.notificationManager) {
            window.notificationManager.show(
                'Filter Updated',
                `Analytics updated for ${period}`,
                'info',
                3000
            );
        }
    }

    exportData() {
        const data = {
            metrics: this.metrics,
            realTimeData: this.realTimeData,
            exportDate: new Date().toISOString(),
            routes: this.metrics.routeEfficiency
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bus-tracker-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.notificationManager) {
            window.notificationManager.show(
                'Data Exported',
                'Analytics data has been downloaded successfully',
                'success',
                4000
            );
        }
    }

    show() {
        document.getElementById('analytics-dashboard').style.display = 'block';
    }

    hide() {
        document.getElementById('analytics-dashboard').style.display = 'none';
    }

    toggle() {
        const dashboard = document.getElementById('analytics-dashboard');
        dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
    }
}

// Initialize analytics dashboard
let analytics;

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other components to load
    setTimeout(() => {
        analytics = new AnalyticsDashboard();
        window.analytics = analytics;
        
        console.log('📊 Analytics Dashboard initialized');
    }, 1000);
});
