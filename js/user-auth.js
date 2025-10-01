// User Authentication and Personalization System
class UserAuthSystem {
    constructor() {
        this.currentUser = null;
        this.userPreferences = {};
        this.favoriteRoutes = [];
        this.travelHistory = [];
        this.notifications = [];
        this._showAuthTimeoutId = null;
        
        this.init();
    }

    init() {
        this.createAuthUI();
        this.loadUserSession();
        this.setupEventListeners();
    }

    createAuthUI() {
        const authHTML = `
            <style>
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    backdrop-filter: blur(10px);
                }
                
                .auth-container {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }
                
                .auth-tabs {
                    display: flex;
                    margin-bottom: 20px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                }
                
                .auth-tab {
                    flex: 1;
                    padding: 12px;
                    background: var(--muted);
                    color: var(--text);
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .auth-tab.active {
                    background: var(--primary);
                    color: white;
                }
                
                .auth-form {
                    display: none;
                }
                
                .auth-form.active {
                    display: block;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: var(--text);
                    font-weight: 500;
                }
                
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    background: var(--muted);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: var(--text);
                    font-size: 14px;
                }
                
                .form-group input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(63,81,181,0.2);
                }
                
                .auth-btn {
                    width: 100%;
                    padding: 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-bottom: 10px;
                }
                
                .auth-btn:hover {
                    background: var(--secondary);
                    transform: translateY(-2px);
                }
                
                .social-login {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .social-btn {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid var(--border);
                    background: var(--muted);
                    color: var(--text);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .social-btn:hover {
                    background: var(--card-hover);
                }
                
                .user-profile {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 15px;
                    display: none;
                    z-index: 1000;
                    min-width: 200px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
                }
                
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    margin-right: 10px;
                }
                
                .user-info {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .user-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .user-menu li {
                    padding: 8px 0;
                    cursor: pointer;
                    transition: color 0.3s;
                }
                
                .user-menu li:hover {
                    color: var(--primary);
                }
                
                .preferences-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }
                
                .preferences-container {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .preference-section {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border);
                }
                
                .preference-section:last-child {
                    border-bottom: none;
                }
                
                .favorite-route {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    padding: 10px;
                    background: var(--muted);
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                
                .remove-favorite {
                    background: var(--danger);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .profile-toggle {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: #fff;
                    border: 1px solid var(--border);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    cursor: pointer;
                    z-index: 1001;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
                }
            </style>
            
            <!-- Auth Modal -->
            <div id="authModal" class="auth-modal">
                <div class="auth-container">
                    <h3 style="text-align: center; margin-bottom: 20px; color: var(--text);">
                        🚌 Delhi Bus Tracker
                    </h3>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" onclick="userAuth.switchTab('login')">Login</button>
                        <button class="auth-tab" onclick="userAuth.switchTab('register')">Register</button>
                    </div>
                    
                    <!-- Login Form -->
                    <form id="loginForm" class="auth-form active">
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <input type="email" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="auth-btn">Login</button>
                        <div class="social-login">
                            <button type="button" class="social-btn" onclick="userAuth.socialLogin('google')">
                                📧 Google
                            </button>
                            <button type="button" class="social-btn" onclick="userAuth.socialLogin('phone')">
                                📱 Phone
                            </button>
                        </div>
                    </form>
                    
                    <!-- Register Form -->
                    <form id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label for="registerName">Full Name</label>
                            <input type="text" id="registerName" required>
                        </div>
                        <div class="form-group">
                            <label for="registerEmail">Email</label>
                            <input type="email" id="registerEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPhone">Phone Number</label>
                            <input type="tel" id="registerPhone" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Password</label>
                            <input type="password" id="registerPassword" required>
                        </div>
                        <button type="submit" class="auth-btn">Create Account</button>
                    </form>
                    
                    <div style="text-align: center; margin-top: 15px;">
                        <button onclick="userAuth.closeAuth()" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- User Profile -->
            <div id="userProfile" class="user-profile">
                <div class="user-info">
                    <div class="user-avatar" id="userAvatar">U</div>
                    <div>
                        <div id="userName" style="font-weight: 600; color: var(--text);">User</div>
                        <div id="userEmail" style="font-size: 12px; color: var(--text-muted);">user@example.com</div>
                    </div>
                </div>
                <ul class="user-menu">
                    <li onclick="userAuth.showPreferences()">⚙️ Preferences</li>
                    <li onclick="userAuth.showFavorites()">⭐ Favorite Routes</li>
                    <li onclick="userAuth.showHistory()">📊 Travel History</li>
                    <li onclick="userAuth.showProfile()">👤 Profile Settings</li>
                    <li onclick="userAuth.logout()">🚪 Logout</li>
                </ul>
            </div>
            <button id="profileToggle" class="profile-toggle" title="Profile">U</button>
            
            <!-- Preferences Modal -->
            <div id="preferencesModal" class="preferences-modal">
                <div class="preferences-container">
                    <h4 style="color: var(--text); margin-bottom: 20px;">⚙️ User Preferences</h4>
                    
                    <div class="preference-section">
                        <h6 style="color: var(--text); margin-bottom: 15px;">🔔 Notifications</h6>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="prefBusArrivals" checked>
                            <label class="form-check-label" for="prefBusArrivals">Bus arrival alerts</label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="prefDelays" checked>
                            <label class="form-check-label" for="prefDelays">Delay notifications</label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="prefRouteUpdates">
                            <label class="form-check-label" for="prefRouteUpdates">Route updates</label>
                        </div>
                    </div>
                    
                    <div class="preference-section">
                        <h6 style="color: var(--text); margin-bottom: 15px;">🎨 Display</h6>
                        <div class="form-group">
                            <label for="prefLanguage">Language</label>
                            <select id="prefLanguage" class="form-select">
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="ur">اردو (Urdu)</option>
                                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                            </select>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="prefDarkMode" checked>
                            <label class="form-check-label" for="prefDarkMode">Dark mode</label>
                        </div>
                    </div>
                    
                    <div class="preference-section">
                        <h6 style="color: var(--text); margin-bottom: 15px;">⭐ Favorite Routes</h6>
                        <div id="favoriteRoutesList"></div>
                        <select id="addFavoriteRoute" class="form-select mb-2">
                            <option value="">Add a favorite route...</option>
                        </select>
                        <button class="btn btn-primary btn-sm" onclick="userAuth.addFavoriteRoute()">Add Route</button>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn btn-primary me-2" onclick="userAuth.savePreferences()">Save Changes</button>
                        <button class="btn btn-secondary" onclick="userAuth.closePreferences()">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', authHTML);
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Close modals on outside click
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.closeAuth();
            }
        });

        document.getElementById('preferencesModal').addEventListener('click', (e) => {
            if (e.target.id === 'preferencesModal') {
                this.closePreferences();
            }
        });

        // Profile toggle button
        const pt = document.getElementById('profileToggle');
        if (pt) {
            pt.addEventListener('click', () => this.toggleProfile());
        }
    }

    showAuth() {
        document.getElementById('authModal').style.display = 'flex';
    }

    closeAuth() {
        document.getElementById('authModal').style.display = 'none';
        if (this._showAuthTimeoutId) {
            clearTimeout(this._showAuthTimeoutId);
            this._showAuthTimeoutId = null;
        }
    }

    switchTab(tab) {
        // Update tab buttons without relying on implicit event
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(btn => btn.classList.remove('active'));
        if (tab === 'login') {
            tabs[0] && tabs[0].classList.add('active');
        } else if (tab === 'register') {
            tabs[1] && tabs[1].classList.add('active');
        }

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        const targetForm = document.getElementById(tab + 'Form');
        if (targetForm) targetForm.classList.add('active');
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Basic validation
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const passOk = typeof password === 'string' && password.length >= 6;
        if (!emailOk || !passOk) {
            const msg = !emailOk
                ? 'Please enter a valid email address (e.g., name@example.com).'
                : 'Password must be at least 6 characters.';
            if (window.notificationManager) {
                window.notificationManager.show('Invalid Credentials', msg, 'error', 4000);
            } else {
                alert(msg);
            }
            return;
        }

        // Simulate login (in real app, this would be an API call)
        try {
            const user = {
                id: Date.now(),
                name: email.split('@')[0],
                email: email,
                avatar: email.charAt(0).toUpperCase(),
                loginTime: new Date(),
                preferences: {
                    language: 'en',
                    notifications: true,
                    darkMode: true
                }
            };

            this.currentUser = user;
            this.saveUserSession();
            this.showUserProfile();
            this.closeAuth();
            if (this._showAuthTimeoutId) {
                clearTimeout(this._showAuthTimeoutId);
                this._showAuthTimeoutId = null;
            }

            if (window.notificationManager) {
                window.notificationManager.show(
                    'Welcome Back!',
                    `Hello ${user.name}, you're now logged in`,
                    'success',
                    4000
                );
            }

            this.loadUserPreferences();
            // Post-login hook (e.g., open map in new tab)
            if (typeof window.postLoginAction === 'function') {
                try { window.postLoginAction(this.currentUser); } catch(_) {}
            }
        } catch (error) {
            if (window.notificationManager) {
                window.notificationManager.show(
                    'Login Failed',
                    'Please check your credentials and try again',
                    'error',
                    5000
                );
            }
        }
    }

    async register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;

        // Basic validation
        const nameOk = name.length >= 2;
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const phoneOk = /^\+?\d{7,15}$/.test(phone);
        const passOk = typeof password === 'string' && password.length >= 6;
        if (!nameOk || !emailOk || !phoneOk || !passOk) {
            let errors = [];
            if (!nameOk) errors.push('Name must be at least 2 characters');
            if (!emailOk) errors.push('Valid email required');
            if (!phoneOk) errors.push('Phone must be 7-15 digits (with optional +)');
            if (!passOk) errors.push('Password must be at least 6 characters');
            const msg = errors.join('\n');
            if (window.notificationManager) {
                window.notificationManager.show('Invalid Registration', msg, 'error', 5000);
            } else {
                alert(msg);
            }
            return;
        }

        // Simulate registration
        try {
            const user = {
                id: Date.now(),
                name: name,
                email: email,
                phone: phone,
                avatar: name.charAt(0).toUpperCase(),
                registrationTime: new Date(),
                preferences: {
                    language: 'en',
                    notifications: true,
                    darkMode: true
                }
            };

            this.currentUser = user;
            this.saveUserSession();
            this.showUserProfile();
            this.closeAuth();

            if (window.notificationManager) {
                window.notificationManager.show(
                    'Account Created!',
                    `Welcome to Delhi Bus Tracker, ${user.name}!`,
                    'success',
                    5000
                );
            }

            this.loadUserPreferences();
            // Post-register hook (e.g., open map in new tab)
            if (typeof window.postLoginAction === 'function') {
                try { window.postLoginAction(this.currentUser); } catch(_) {}
            }
        } catch (error) {
            if (window.notificationManager) {
                window.notificationManager.show(
                    'Registration Failed',
                    'Please try again with valid information',
                    'error',
                    5000
                );
            }
        }
    }

    socialLogin(provider) {
        // Simulate social login
        const user = {
            id: Date.now(),
            name: `${provider} User`,
            email: `user@${provider}.com`,
            avatar: provider.charAt(0).toUpperCase(),
            loginTime: new Date(),
            provider: provider,
            preferences: {
                language: 'en',
                notifications: true,
                darkMode: true
            }
        };

        this.currentUser = user;
        this.saveUserSession();
        this.showUserProfile();
        this.closeAuth();

        if (window.notificationManager) {
            window.notificationManager.show(
                'Login Successful',
                `Logged in with ${provider}`,
                'success',
                4000
            );
        }
    }

    showUserProfile() {
        if (!this.currentUser) return;

        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userEmail').textContent = this.currentUser.email;
        document.getElementById('userAvatar').textContent = this.currentUser.avatar;
        // Keep panel hidden by default; let user open via toggle
        document.getElementById('userProfile').style.display = 'none';
        const pt = document.getElementById('profileToggle');
        if (pt) {
            pt.textContent = this.currentUser.avatar;
            pt.style.display = 'flex';
        }
    }

    hideUserProfile() {
        document.getElementById('userProfile').style.display = 'none';
        const pt = document.getElementById('profileToggle');
        if (pt) pt.style.display = 'none';
    }

    toggleProfile() {
        const panel = document.getElementById('userProfile');
        if (!panel) return;
        const visible = panel.style.display !== 'none';
        panel.style.display = visible ? 'none' : 'block';
    }

    logout() {
        this.currentUser = null;
        this.userPreferences = {};
        this.favoriteRoutes = [];
        localStorage.removeItem('busTracker_user');
        localStorage.removeItem('busTracker_preferences');
        this.hideUserProfile();

        if (window.notificationManager) {
            window.notificationManager.show(
                'Logged Out',
                'You have been successfully logged out',
                'info',
                3000
            );
        }
    }

    showPreferences() {
        this.populateFavoriteRoutes();
        this.loadPreferencesForm();
        document.getElementById('preferencesModal').style.display = 'flex';
    }

    closePreferences() {
        document.getElementById('preferencesModal').style.display = 'none';
    }

    populateFavoriteRoutes() {
        const routeSelect = document.getElementById('addFavoriteRoute');
        const favoritesList = document.getElementById('favoriteRoutesList');
        
        // Clear and populate route selector
        routeSelect.innerHTML = '<option value="">Add a favorite route...</option>';
        Object.entries(ENHANCED_DELHI_DATA.routes).forEach(([routeId, route]) => {
            if (!this.favoriteRoutes.includes(routeId)) {
                routeSelect.innerHTML += `<option value="${routeId}">${routeId} - ${route.name}</option>`;
            }
        });

        // Display current favorites
        favoritesList.innerHTML = '';
        this.favoriteRoutes.forEach(routeId => {
            const route = ENHANCED_DELHI_DATA.routes[routeId];
            if (route) {
                favoritesList.innerHTML += `
                    <div class="favorite-route">
                        <div>
                            <strong>${routeId}</strong><br>
                            <small>${route.name}</small>
                        </div>
                        <button class="remove-favorite" onclick="userAuth.removeFavoriteRoute('${routeId}')">
                            Remove
                        </button>
                    </div>
                `;
            }
        });
    }

    addFavoriteRoute() {
        const select = document.getElementById('addFavoriteRoute');
        const routeId = select.value;
        
        if (routeId && !this.favoriteRoutes.includes(routeId)) {
            this.favoriteRoutes.push(routeId);
            this.populateFavoriteRoutes();
            
            if (window.notificationManager) {
                window.notificationManager.show(
                    'Route Added',
                    `${routeId} added to favorites`,
                    'success',
                    3000
                );
            }
        }
    }

    removeFavoriteRoute(routeId) {
        this.favoriteRoutes = this.favoriteRoutes.filter(id => id !== routeId);
        this.populateFavoriteRoutes();
        
        if (window.notificationManager) {
            window.notificationManager.show(
                'Route Removed',
                `${routeId} removed from favorites`,
                'info',
                3000
            );
        }
    }

    loadPreferencesForm() {
        if (this.userPreferences.notifications !== undefined) {
            document.getElementById('prefBusArrivals').checked = this.userPreferences.notifications.busArrivals;
            document.getElementById('prefDelays').checked = this.userPreferences.notifications.delays;
            document.getElementById('prefRouteUpdates').checked = this.userPreferences.notifications.routeUpdates;
        }
        
        if (this.userPreferences.language) {
            document.getElementById('prefLanguage').value = this.userPreferences.language;
        }
        
        if (this.userPreferences.darkMode !== undefined) {
            document.getElementById('prefDarkMode').checked = this.userPreferences.darkMode;
        }
    }

    savePreferences() {
        this.userPreferences = {
            notifications: {
                busArrivals: document.getElementById('prefBusArrivals').checked,
                delays: document.getElementById('prefDelays').checked,
                routeUpdates: document.getElementById('prefRouteUpdates').checked
            },
            language: document.getElementById('prefLanguage').value,
            darkMode: document.getElementById('prefDarkMode').checked
        };

        localStorage.setItem('busTracker_preferences', JSON.stringify(this.userPreferences));
        localStorage.setItem('busTracker_favorites', JSON.stringify(this.favoriteRoutes));
        
        this.closePreferences();
        
        if (window.notificationManager) {
            window.notificationManager.show(
                'Preferences Saved',
                'Your settings have been updated',
                'success',
                3000
            );
        }
    }

    loadUserPreferences() {
        const saved = localStorage.getItem('busTracker_preferences');
        const favorites = localStorage.getItem('busTracker_favorites');
        
        if (saved) {
            this.userPreferences = JSON.parse(saved);
        }
        
        if (favorites) {
            this.favoriteRoutes = JSON.parse(favorites);
        }
    }

    saveUserSession() {
        localStorage.setItem('busTracker_user', JSON.stringify(this.currentUser));
    }

    loadUserSession() {
        const saved = localStorage.getItem('busTracker_user');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            this.showUserProfile();
            this.loadUserPreferences();
        } else {
            // Show auth modal for new users
            this._showAuthTimeoutId = setTimeout(() => {
                this.showAuth();
            }, 2000);
        }
    }

    showFavorites() {
        if (this.favoriteRoutes.length === 0) {
            if (window.notificationManager) {
                window.notificationManager.show(
                    'No Favorites',
                    'Add some favorite routes in preferences',
                    'info',
                    4000
                );
            }
            return;
        }

        let message = 'Your favorite routes:\n\n';
        this.favoriteRoutes.forEach(routeId => {
            const route = ENHANCED_DELHI_DATA.routes[routeId];
            if (route) {
                message += `🚌 ${routeId}: ${route.name}\n`;
            }
        });

        alert(message);
    }

    showHistory() {
        // Simulate travel history
        const history = [
            { date: '2024-01-15', route: 'DTC-001', from: 'Connaught Place', to: 'Red Fort', fare: 15 },
            { date: '2024-01-14', route: 'DTC-181', from: 'Karol Bagh', to: 'Nehru Place', fare: 20 },
            { date: '2024-01-13', route: 'DTC-764', from: 'Dwarka', to: 'Connaught Place', fare: 25 }
        ];

        let message = '📊 Recent Travel History:\n\n';
        history.forEach(trip => {
            message += `${trip.date}: ${trip.route}\n${trip.from} → ${trip.to} (₹${trip.fare})\n\n`;
        });

        alert(message);
    }

    showProfile() {
        if (!this.currentUser) return;

        const profile = `
👤 Profile Information:

Name: ${this.currentUser.name}
Email: ${this.currentUser.email}
${this.currentUser.phone ? `Phone: ${this.currentUser.phone}` : ''}
Member since: ${new Date(this.currentUser.registrationTime || this.currentUser.loginTime).toLocaleDateString()}

Favorite Routes: ${this.favoriteRoutes.length}
Language: ${this.userPreferences.language || 'English'}
        `;

        alert(profile);
    }

    // Get personalized recommendations
    getRecommendations() {
        if (!this.currentUser) return [];

        // Simple recommendation based on favorites and usage patterns
        const recommendations = [];
        
        this.favoriteRoutes.forEach(routeId => {
            const route = ENHANCED_DELHI_DATA.routes[routeId];
            if (route) {
                recommendations.push({
                    type: 'favorite',
                    routeId,
                    route,
                    reason: 'One of your favorite routes'
                });
            }
        });

        return recommendations;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get user's preferred language
    getLanguage() {
        return this.userPreferences.language || 'en';
    }
}

// Initialize user authentication system
let userAuth;

document.addEventListener('DOMContentLoaded', function() {
    userAuth = new UserAuthSystem();
    window.userAuth = userAuth;
    
    console.log('👤 User Authentication System initialized');
});
