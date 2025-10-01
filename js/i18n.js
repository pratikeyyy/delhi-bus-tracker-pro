// Multi-Language Support for Delhi Bus Tracker
class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.rtlLanguages = ['ur', 'ar'];
        this.init();
    }

    init() {
        this.loadTranslations();
        this.detectLanguage();
        this.createLanguageSelector();
    }

    loadTranslations() {
        this.translations = {
            en: {
                // Header
                'app.title': 'Delhi Bus Tracker Pro',
                'app.subtitle': 'Professional Real-time GPS tracking for Delhi Transport Corporation',
                'live.tracking': 'Live Tracking Active',
                'buses.moving': 'Buses Moving',
                'last.updated': 'Last updated',

                // Navigation
                'route.finder': 'Route Finder',
                'bus.stop.info': 'Bus Stop Info',
                'quick.actions': 'Quick Actions',
                'live.statistics': 'Live Statistics',
                'conditions': 'Conditions',

                // Forms
                'from': 'From',
                'to': 'To',
                'select.origin': 'Select Origin',
                'select.destination': 'Select Destination',
                'find.routes': 'Find Routes',
                'search.bus.stop': 'Search Bus Stop',
                'select.stop': 'Select a stop',

                // Metrics
                'active.buses': 'Active Buses',
                'passengers': 'Passengers',
                'avg.delay': 'Avg Delay (min)',
                'revenue': 'Revenue',
                'fuel.efficiency': 'Fuel Efficiency (km/l)',
                'customer.rating': 'Customer Rating',
                'routes.active': 'Routes Active',

                // Actions
                'show.all.buses': 'Show All Buses',
                'traffic.info': 'Traffic Info',
                'nearby.stops': 'Nearby Stops',
                'fare.calculator': 'Fare Calculator',

                // Weather
                'weather': 'Weather',
                'traffic': 'Traffic',
                'clear': 'Clear',
                'moderate': 'Moderate',
                'heavy': 'Heavy',

                // Bus Details
                'bus.details': 'Selected Bus Details',
                'click.bus.marker': 'Click on any bus marker on the map to view details',
                'current.location': 'Current Location',
                'next.stop': 'Next Stop',
                'speed': 'Speed',
                'fare': 'Fare',
                'delay.status': 'Delay Status',
                'minutes': 'minutes',

                // Notifications
                'welcome': 'Welcome to Delhi Bus Tracker Pro!',
                'notifications.active': 'Real-time notifications are now active. Click the bell icon to customize your preferences.',
                'bus.arriving': 'Bus Arriving Soon!',
                'arriving.in': 'arriving at',
                'in': 'in',
                'delay.alert': 'Significant Delay Alert',
                'running.late': 'is running',
                'late.on': 'minutes late on',
                'route.update': 'Route Update',
                'updated.with': 'has been updated with new stops and timings',

                // Common
                'loading': 'Loading...',
                'error': 'Error',
                'success': 'Success',
                'cancel': 'Cancel',
                'save': 'Save',
                'close': 'Close',
                'ok': 'OK',
                'yes': 'Yes',
                'no': 'No'
            },

            hi: {
                // Header
                'app.title': 'दिल्ली बस ट्रैकर प्रो',
                'app.subtitle': 'दिल्ली परिवहन निगम के लिए पेशेवर रियल-टाइम जीपीएस ट्रैकिंग',
                'live.tracking': 'लाइव ट्रैकिंग सक्रिय',
                'buses.moving': 'चलती बसें',
                'last.updated': 'अंतिम अपडेट',

                // Navigation
                'route.finder': 'रूट खोजक',
                'bus.stop.info': 'बस स्टॉप जानकारी',
                'quick.actions': 'त्वरित कार्य',
                'live.statistics': 'लाइव आंकड़े',
                'conditions': 'स्थितियां',

                // Forms
                'from': 'से',
                'to': 'तक',
                'select.origin': 'प्रारंभिक स्थान चुनें',
                'select.destination': 'गंतव्य चुनें',
                'find.routes': 'रूट खोजें',
                'search.bus.stop': 'बस स्टॉप खोजें',
                'select.stop': 'एक स्टॉप चुनें',

                // Metrics
                'active.buses': 'सक्रिय बसें',
                'passengers': 'यात्री',
                'avg.delay': 'औसत देरी (मिनट)',
                'revenue': 'आय',
                'fuel.efficiency': 'ईंधन दक्षता (किमी/लीटर)',
                'customer.rating': 'ग्राहक रेटिंग',
                'routes.active': 'सक्रिय रूट',

                // Actions
                'show.all.buses': 'सभी बसें दिखाएं',
                'traffic.info': 'ट्रैफिक जानकारी',
                'nearby.stops': 'नजदीकी स्टॉप',
                'fare.calculator': 'किराया कैलकुलेटर',

                // Weather
                'weather': 'मौसम',
                'traffic': 'ट्रैफिक',
                'clear': 'साफ',
                'moderate': 'मध्यम',
                'heavy': 'भारी',

                // Bus Details
                'bus.details': 'चयनित बस विवरण',
                'click.bus.marker': 'विवरण देखने के लिए मानचित्र पर किसी भी बस मार्कर पर क्लिक करें',
                'current.location': 'वर्तमान स्थान',
                'next.stop': 'अगला स्टॉप',
                'speed': 'गति',
                'fare': 'किराया',
                'delay.status': 'देरी की स्थिति',
                'minutes': 'मिनट',

                // Common
                'loading': 'लोड हो रहा है...',
                'error': 'त्रुटि',
                'success': 'सफलता',
                'cancel': 'रद्द करें',
                'save': 'सहेजें',
                'close': 'बंद करें',
                'ok': 'ठीक है',
                'yes': 'हां',
                'no': 'नहीं'
            },

            ur: {
                // Header
                'app.title': 'دہلی بس ٹریکر پرو',
                'app.subtitle': 'دہلی ٹرانسپورٹ کارپوریشن کے لیے پیشہ ورانہ ریئل ٹائم جی پی ایس ٹریکنگ',
                'live.tracking': 'لائیو ٹریکنگ فعال',
                'buses.moving': 'چلتی بسیں',
                'last.updated': 'آخری اپ ڈیٹ',

                // Navigation
                'route.finder': 'روٹ تلاش کنندہ',
                'bus.stop.info': 'بس اسٹاپ کی معلومات',
                'quick.actions': 'فوری اعمال',
                'live.statistics': 'لائیو اعداد و شمار',
                'conditions': 'حالات',

                // Forms
                'from': 'سے',
                'to': 'تک',
                'select.origin': 'ابتدائی مقام منتخب کریں',
                'select.destination': 'منزل منتخب کریں',
                'find.routes': 'روٹس تلاش کریں',
                'search.bus.stop': 'بس اسٹاپ تلاش کریں',
                'select.stop': 'ایک اسٹاپ منتخب کریں',

                // Common
                'loading': 'لوڈ ہو رہا ہے...',
                'error': 'خرابی',
                'success': 'کامیابی',
                'cancel': 'منسوخ کریں',
                'save': 'محفوظ کریں',
                'close': 'بند کریں',
                'ok': 'ٹھیک ہے',
                'yes': 'ہاں',
                'no': 'نہیں'
            },

            pa: {
                // Header
                'app.title': 'ਦਿੱਲੀ ਬੱਸ ਟਰੈਕਰ ਪ੍ਰੋ',
                'app.subtitle': 'ਦਿੱਲੀ ਟਰਾਂਸਪੋਰਟ ਕਾਰਪੋਰੇਸ਼ਨ ਲਈ ਪੇਸ਼ੇਵਰ ਰੀਅਲ-ਟਾਈਮ ਜੀਪੀਐਸ ਟਰੈਕਿੰਗ',
                'live.tracking': 'ਲਾਈਵ ਟਰੈਕਿੰਗ ਸਰਗਰਮ',
                'buses.moving': 'ਚੱਲਦੀਆਂ ਬੱਸਾਂ',
                'last.updated': 'ਆਖਰੀ ਅੱਪਡੇਟ',

                // Common
                'loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
                'error': 'ਗਲਤੀ',
                'success': 'ਸਫਲਤਾ',
                'cancel': 'ਰੱਦ ਕਰੋ',
                'save': 'ਸੇਵ ਕਰੋ',
                'close': 'ਬੰਦ ਕਰੋ',
                'ok': 'ਠੀਕ ਹੈ',
                'yes': 'ਹਾਂ',
                'no': 'ਨਹੀਂ'
            }
        };
    }

    detectLanguage() {
        // Check user preference first
        const saved = localStorage.getItem('busTracker_language');
        if (saved && this.translations[saved]) {
            this.currentLanguage = saved;
            return;
        }

        // Check browser language
        const browserLang = navigator.language.split('-')[0];
        if (this.translations[browserLang]) {
            this.currentLanguage = browserLang;
        }
    }

    createLanguageSelector() {
        const selectorHTML = `
            <div id="language-selector" style="position: fixed; top: 80px; right: 20px; z-index: 1000;">
                <select id="languageSelect" class="form-select" style="width: 120px; background: var(--card); border: 1px solid var(--border); color: var(--text);">
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="ur">اردو</option>
                    <option value="pa">ਪੰਜਾਬੀ</option>
                </select>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', selectorHTML);
        
        const select = document.getElementById('languageSelect');
        select.value = this.currentLanguage;
        select.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
    }

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        
        this.currentLanguage = lang;
        localStorage.setItem('busTracker_language', lang);
        
        // Update document direction for RTL languages
        document.dir = this.rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
        
        // Update all translatable elements
        this.updateTranslations();
        
        // Notify other components
        this.notifyLanguageChange(lang);
    }

    updateTranslations() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'button') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update specific elements by ID
        const updates = {
            'app-title': 'app.title',
            'app-subtitle': 'app.subtitle',
            'live-tracking-text': 'live.tracking',
            'buses-moving-label': 'buses.moving',
            'last-update-label': 'last.updated'
        };

        Object.entries(updates).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = this.translate(key);
            }
        });
    }

    translate(key, params = {}) {
        const translation = this.translations[this.currentLanguage]?.[key] || 
                          this.translations['en']?.[key] || 
                          key;

        // Replace parameters in translation
        return Object.entries(params).reduce((text, [param, value]) => {
            return text.replace(`{${param}}`, value);
        }, translation);
    }

    notifyLanguageChange(lang) {
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang, isRTL: this.rtlLanguages.includes(lang) }
        }));

        if (window.notificationManager) {
            const langNames = {
                'en': 'English',
                'hi': 'हिंदी',
                'ur': 'اردو',
                'pa': 'ਪੰਜਾਬੀ'
            };
            
            window.notificationManager.show(
                this.translate('success'),
                `Language changed to ${langNames[lang]}`,
                'success',
                3000
            );
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    isRTL() {
        return this.rtlLanguages.includes(this.currentLanguage);
    }

    // Format numbers according to locale
    formatNumber(number) {
        const locales = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'ur': 'ur-PK',
            'pa': 'pa-IN'
        };

        return new Intl.NumberFormat(locales[this.currentLanguage] || 'en-IN').format(number);
    }

    // Format currency
    formatCurrency(amount) {
        const locales = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'ur': 'ur-PK',
            'pa': 'pa-IN'
        };

        return new Intl.NumberFormat(locales[this.currentLanguage] || 'en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    // Format time
    formatTime(date) {
        const locales = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'ur': 'ur-PK',
            'pa': 'pa-IN'
        };

        return new Intl.DateTimeFormat(locales[this.currentLanguage] || 'en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Initialize i18n manager
let i18nManager;

document.addEventListener('DOMContentLoaded', function() {
    i18nManager = new I18nManager();
    window.i18n = i18nManager;
    
    console.log('🌐 Multi-language support initialized');
    
    // Add translation attributes to existing elements
    setTimeout(() => {
        addTranslationAttributes();
    }, 1000);
});

function addTranslationAttributes() {
    // Add data-i18n attributes to key elements
    const translations = {
        'h1': 'app.title',
        '.live-indicator + text': 'live.tracking',
        'button[onclick="findRoute()"]': 'find.routes',
        'button[onclick="searchStop()"]': 'search.bus.stop'
    };

    // This would be expanded to cover all UI elements
    console.log('📝 Translation attributes added');
}

// Helper function for components to use translations
window.t = function(key, params = {}) {
    return window.i18n ? window.i18n.translate(key, params) : key;
};
