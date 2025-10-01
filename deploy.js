// Deployment and Testing Script for Delhi Bus Tracker Pro
const fs = require('fs');
const path = require('path');

class DeploymentManager {
    constructor() {
        this.projectRoot = __dirname;
        this.requiredFiles = [
            'delhi-advanced.html',
            'manifest.json',
            'sw.js',
            'js/enhanced-delhi-data.js',
            'js/live-tracking.js',
            'js/notifications.js',
            'js/analytics-dashboard.js',
            'js/user-auth.js',
            'js/i18n.js',
            'netlify.toml',
            'package.json'
        ];
        this.deploymentChecks = [];
    }

    async runDeploymentChecks() {
        console.log('🚀 Starting Delhi Bus Tracker Pro Deployment Checks...\n');
        
        await this.checkFileStructure();
        await this.validateManifest();
        await this.checkServiceWorker();
        await this.validateJavaScriptFiles();
        await this.checkNetlifyConfig();
        await this.generateDeploymentReport();
        
        console.log('\n✅ Deployment checks completed!');
        return this.deploymentChecks;
    }

    async checkFileStructure() {
        console.log('📁 Checking file structure...');
        
        for (const file of this.requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            const exists = fs.existsSync(filePath);
            
            this.deploymentChecks.push({
                check: `File: ${file}`,
                status: exists ? 'PASS' : 'FAIL',
                message: exists ? 'File exists' : 'File missing'
            });
            
            console.log(`  ${exists ? '✅' : '❌'} ${file}`);
        }
    }

    async validateManifest() {
        console.log('\n📱 Validating PWA manifest...');
        
        try {
            const manifestPath = path.join(this.projectRoot, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            const requiredFields = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
            let manifestValid = true;
            
            for (const field of requiredFields) {
                const hasField = manifest.hasOwnProperty(field);
                if (!hasField) manifestValid = false;
                console.log(`  ${hasField ? '✅' : '❌'} ${field}`);
            }
            
            this.deploymentChecks.push({
                check: 'PWA Manifest',
                status: manifestValid ? 'PASS' : 'FAIL',
                message: manifestValid ? 'All required fields present' : 'Missing required fields'
            });
            
        } catch (error) {
            console.log('  ❌ Invalid JSON or file not found');
            this.deploymentChecks.push({
                check: 'PWA Manifest',
                status: 'FAIL',
                message: 'Invalid JSON or file not found'
            });
        }
    }

    async checkServiceWorker() {
        console.log('\n🔧 Checking Service Worker...');
        
        try {
            const swPath = path.join(this.projectRoot, 'sw.js');
            const swContent = fs.readFileSync(swPath, 'utf8');
            
            const requiredFeatures = [
                'install',
                'activate', 
                'fetch',
                'caches',
                'CACHE_NAME'
            ];
            
            let swValid = true;
            for (const feature of requiredFeatures) {
                const hasFeature = swContent.includes(feature);
                if (!hasFeature) swValid = false;
                console.log(`  ${hasFeature ? '✅' : '❌'} ${feature} event/feature`);
            }
            
            this.deploymentChecks.push({
                check: 'Service Worker',
                status: swValid ? 'PASS' : 'FAIL',
                message: swValid ? 'All required features present' : 'Missing required features'
            });
            
        } catch (error) {
            console.log('  ❌ Service Worker file not found or invalid');
            this.deploymentChecks.push({
                check: 'Service Worker',
                status: 'FAIL',
                message: 'File not found or invalid'
            });
        }
    }

    async validateJavaScriptFiles() {
        console.log('\n📜 Validating JavaScript modules...');
        
        const jsFiles = [
            { file: 'js/notifications.js', className: 'NotificationManager' },
            { file: 'js/analytics-dashboard.js', className: 'AnalyticsDashboard' },
            { file: 'js/user-auth.js', className: 'UserAuthSystem' },
            { file: 'js/i18n.js', className: 'I18nManager' },
            { file: 'js/live-tracking.js', className: 'DelhiBusTracker' }
        ];
        
        for (const { file, className } of jsFiles) {
            try {
                const filePath = path.join(this.projectRoot, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const hasClass = content.includes(`class ${className}`);
                
                console.log(`  ${hasClass ? '✅' : '❌'} ${file} (${className})`);
                
                this.deploymentChecks.push({
                    check: `JavaScript: ${file}`,
                    status: hasClass ? 'PASS' : 'FAIL',
                    message: hasClass ? `${className} class found` : `${className} class missing`
                });
                
            } catch (error) {
                console.log(`  ❌ ${file} - File not found`);
                this.deploymentChecks.push({
                    check: `JavaScript: ${file}`,
                    status: 'FAIL',
                    message: 'File not found'
                });
            }
        }
    }

    async checkNetlifyConfig() {
        console.log('\n🌐 Checking Netlify configuration...');
        
        try {
            const configPath = path.join(this.projectRoot, 'netlify.toml');
            const config = fs.readFileSync(configPath, 'utf8');
            
            const requiredSections = [
                '[build]',
                '[[redirects]]',
                'functions = "netlify/functions"'
            ];
            
            let configValid = true;
            for (const section of requiredSections) {
                const hasSection = config.includes(section);
                if (!hasSection) configValid = false;
                console.log(`  ${hasSection ? '✅' : '❌'} ${section}`);
            }
            
            this.deploymentChecks.push({
                check: 'Netlify Config',
                status: configValid ? 'PASS' : 'FAIL',
                message: configValid ? 'All required sections present' : 'Missing required sections'
            });
            
        } catch (error) {
            console.log('  ❌ netlify.toml not found or invalid');
            this.deploymentChecks.push({
                check: 'Netlify Config',
                status: 'FAIL',
                message: 'File not found or invalid'
            });
        }
    }

    async generateDeploymentReport() {
        console.log('\n📊 Generating deployment report...');
        
        const passedChecks = this.deploymentChecks.filter(check => check.status === 'PASS').length;
        const totalChecks = this.deploymentChecks.length;
        const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
        
        const report = {
            timestamp: new Date().toISOString(),
            project: 'Delhi Bus Tracker Pro',
            version: '1.2.0',
            totalChecks,
            passedChecks,
            failedChecks: totalChecks - passedChecks,
            successRate: `${successRate}%`,
            checks: this.deploymentChecks,
            recommendations: this.generateRecommendations()
        };
        
        // Save report
        const reportPath = path.join(this.projectRoot, 'deployment-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📈 Deployment Report Summary:`);
        console.log(`   Total Checks: ${totalChecks}`);
        console.log(`   Passed: ${passedChecks}`);
        console.log(`   Failed: ${totalChecks - passedChecks}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Report saved: deployment-report.json`);
        
        return report;
    }

    generateRecommendations() {
        const failedChecks = this.deploymentChecks.filter(check => check.status === 'FAIL');
        const recommendations = [];
        
        if (failedChecks.length === 0) {
            recommendations.push('🎉 All checks passed! Your Delhi Bus Tracker Pro is ready for deployment.');
            recommendations.push('🚀 Consider running additional performance tests before going live.');
            recommendations.push('📱 Test PWA installation on different devices and browsers.');
        } else {
            recommendations.push('⚠️ Some checks failed. Please address the following issues:');
            failedChecks.forEach(check => {
                recommendations.push(`   • ${check.check}: ${check.message}`);
            });
        }
        
        recommendations.push('💡 Additional deployment tips:');
        recommendations.push('   • Test all features in production environment');
        recommendations.push('   • Verify HTTPS is enabled for PWA features');
        recommendations.push('   • Check mobile responsiveness on various devices');
        recommendations.push('   • Test offline functionality');
        recommendations.push('   • Verify multi-language support works correctly');
        
        return recommendations;
    }

    async createIconPlaceholders() {
        console.log('\n🎨 Creating icon placeholders...');
        
        const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
        const iconsDir = path.join(this.projectRoot, 'icons');
        
        if (!fs.existsSync(iconsDir)) {
            fs.mkdirSync(iconsDir, { recursive: true });
        }
        
        // Create SVG placeholder icons
        for (const size of iconSizes) {
            const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#1a237e"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold">🚌</text>
</svg>`;
            
            const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
            // In a real deployment, you'd convert SVG to PNG here
            // For now, we'll create the SVG file
            const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
            fs.writeFileSync(svgPath, svgContent.trim());
        }
        
        console.log('  ✅ Icon placeholders created in /icons directory');
        console.log('  💡 Convert SVG files to PNG for production use');
    }
}

// Run deployment checks if this file is executed directly
if (require.main === module) {
    const deploymentManager = new DeploymentManager();
    
    deploymentManager.runDeploymentChecks()
        .then(async () => {
            await deploymentManager.createIconPlaceholders();
            console.log('\n🎯 Next Steps:');
            console.log('   1. Review deployment-report.json');
            console.log('   2. Fix any failed checks');
            console.log('   3. Convert SVG icons to PNG format');
            console.log('   4. Test the application locally');
            console.log('   5. Deploy to Netlify');
            console.log('\n🚀 Ready to deploy your enhanced Delhi Bus Tracker Pro!');
        })
        .catch(error => {
            console.error('❌ Deployment check failed:', error);
            process.exit(1);
        });
}

module.exports = DeploymentManager;
