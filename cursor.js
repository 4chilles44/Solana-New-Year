// New Year's Fireworks Display with Points System
// Click to launch fireworks - size and text based on points
//
// MULTIPLAYER READY:
// - Uses object pooling for efficient memory management
// - launchFireworkFromData() accepts external firework data for network sync
// - All firework properties are serializable for network transmission
//
// To integrate multiplayer:
// 1. When user clicks, call launchRocket() which returns firework data
// 2. Send this data to server/peers: { x, points, fireworkType }
// 3. On receive, call fireworks.launchFireworkFromData(x, points, fireworkType)
//
// Example WebSocket integration:
//   socket.on('firework', (data) => {
//     fireworks.launchFireworkFromData(data.x, data.points, data.fireworkType);
//   });

class FireworksDisplay {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.started = false;
        this.rockets = [];
        this.particles = [];
        this.textParticles = [];

        // Points system - can be set externally
        this.userPoints = 500; // Default points (medium size for demo)

        // Object pools for performance optimization
        this.particlePool = [];
        this.textParticlePool = [];
        this.maxPoolSize = 5000;

        // Geolocation data
        this.userCountry = null;
        this.userCountryName = null;
        this.countryColors = null;

        // Background elements
        this.stars = [];
        this.generateStars();
        this.cityBuildings = [];
        this.generateCity();

        this.setupCanvas();
        this.setupEventListeners();
        this.startAnimation();
        this.detectUserLocation();
    }

    // Generate random stars
    generateStars() {
        const starCount = 100;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * (window.innerHeight * 0.4), // Top 40% of screen
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    // Generate static city silhouette that spans full width
    generateCity() {
        this.cityBuildings = [];
        const cityHeight = window.innerHeight * 0.165; // 10% taller (was 0.15)
        const buildingWidths = [60, 80, 50, 90, 70, 85, 60, 75, 55, 80, 65, 90, 100, 45];

        let currentX = 0;
        let buildingIndex = 0;

        // Generate buildings to fill the entire canvas width
        while (currentX < window.innerWidth) {
            const width = buildingWidths[buildingIndex % buildingWidths.length];
            // More dramatic height variation (0.4 to 1.0 instead of 0.6 to 1.0)
            const height = cityHeight * (0.4 + Math.random() * 0.6);

            // Generate window positions for this building with smaller, tighter grid
            const windows = [];
            const windowSpacingX = 8; // Tighter horizontal spacing (was 12)
            const windowSpacingY = 7; // Tighter vertical spacing (was 10)
            const marginX = 6; // Smaller side margins (was 8)
            const marginY = 6; // Smaller top/bottom margins (was 8)

            const windowCols = Math.floor((width - marginX * 2) / windowSpacingX);
            const windowRows = Math.floor((height - marginY * 2) / windowSpacingY);

            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    // Sparse windows - only 30% chance of a window existing
                    if (Math.random() < 0.3) {
                        const isLit = Math.random() < 0.6; // 60% of existing windows start lit
                        windows.push({
                            x: marginX + col * windowSpacingX,
                            y: marginY + row * windowSpacingY,
                            brightness: isLit ? (Math.random() * 0.4 + 0.6) : 0, // 0.6 to 1.0 or off
                            targetBrightness: isLit ? (Math.random() * 0.4 + 0.6) : 0,
                            glimmerSpeed: Math.random() * 0.003 + 0.001, // Very slow, subtle glimmer
                            flickerTimer: Math.random() * 30, // Random timer for turning on/off
                            flickerInterval: 20 + Math.random() * 40, // 20-60 seconds between flickers (much slower)
                            isOn: isLit
                        });
                    }
                }
            }

            this.cityBuildings.push({
                x: currentX,
                width: width,
                height: height,
                windows: windows
            });

            currentX += width;
            buildingIndex++;
        }
    }

    // Object pooling - reuse particles instead of creating new ones
    getParticle() {
        return this.particlePool.pop() || {};
    }

    releaseParticle(particle) {
        if (this.particlePool.length < this.maxPoolSize) {
            // Reset particle properties
            particle.trail = [];
            this.particlePool.push(particle);
        }
    }

    getTextParticle() {
        return this.textParticlePool.pop() || {};
    }

    releaseTextParticle(particle) {
        if (this.textParticlePool.length < this.maxPoolSize) {
            this.textParticlePool.push(particle);
        }
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // Regenerate background elements for new dimensions
            this.stars = [];
            this.generateStars();
            this.cityBuildings = [];
            this.generateCity();
        });
    }

    // Detect user location using IP geolocation
    async detectUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            this.userCountry = data.country_code;
            this.userCountryName = data.country_name;

            // Get colors for this country's flag
            this.countryColors = this.getFlagColors(this.userCountry);

            console.log(`Detected location: ${this.userCountryName} (${this.userCountry})`);
            console.log('Flag colors:', this.countryColors);
        } catch (err) {
            console.error('Could not detect location:', err);
            // Default to random country
            this.userCountry = null;
        }
    }

    // Get flag colors for a country code with layout information
    // layout: 'vertical' = left-to-right stripes, 'horizontal' = top-to-bottom stripes
    // colorStops: custom positions for gradient stops to match flag layout
    getFlagColors(countryCode) {
        const flagColors = {
            // Vertical tricolor flags (left to right)
            'FR': { colors: [{r: 0, g: 85, b: 164}, {r: 255, g: 255, b: 255}, {r: 239, g: 65, b: 53}], name: 'FRANCE', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'IT': { colors: [{r: 0, g: 146, b: 70}, {r: 255, g: 255, b: 255}, {r: 206, g: 43, b: 55}], name: 'ITALY', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'IE': { colors: [{r: 22, g: 155, b: 98}, {r: 255, g: 255, b: 255}, {r: 255, g: 136, b: 62}], name: 'IRELAND', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'BE': { colors: [{r: 0, g: 0, b: 0}, {r: 253, g: 218, b: 36}, {r: 239, g: 51, b: 64}], name: 'BELGIUM', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'RO': { colors: [{r: 0, g: 43, b: 127}, {r: 252, g: 209, b: 22}, {r: 206, g: 17, b: 38}], name: 'ROMANIA', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'MX': { colors: [{r: 0, g: 104, b: 71}, {r: 255, g: 255, b: 255}, {r: 206, g: 17, b: 38}], name: 'MEXICO', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'NG': { colors: [{r: 0, g: 135, b: 81}, {r: 255, g: 255, b: 255}, {r: 0, g: 135, b: 81}], name: 'NIGERIA', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'PE': { colors: [{r: 217, g: 16, b: 35}, {r: 255, g: 255, b: 255}, {r: 217, g: 16, b: 35}], name: 'PERU', layout: 'vertical', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },

            // Horizontal tricolor flags (top to bottom)
            'DE': { colors: [{r: 0, g: 0, b: 0}, {r: 255, g: 0, b: 0}, {r: 255, g: 206, b: 0}], name: 'GERMANY', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'RU': { colors: [{r: 255, g: 255, b: 255}, {r: 0, g: 57, b: 166}, {r: 213, g: 43, b: 30}], name: 'RUSSIA', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'NL': { colors: [{r: 174, g: 28, b: 40}, {r: 255, g: 255, b: 255}, {r: 33, g: 70, b: 139}], name: 'NETHERLANDS', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'HU': { colors: [{r: 205, g: 42, b: 62}, {r: 255, g: 255, b: 255}, {r: 67, g: 111, b: 77}], name: 'HUNGARY', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'AT': { colors: [{r: 237, g: 41, b: 57}, {r: 255, g: 255, b: 255}, {r: 237, g: 41, b: 57}], name: 'AUSTRIA', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'PL': { colors: [{r: 255, g: 255, b: 255}, {r: 220, g: 20, b: 60}], name: 'POLAND', layout: 'horizontal', colorStops: [0, 0.5, 0.5, 1] },
            'ID': { colors: [{r: 255, g: 0, b: 0}, {r: 255, g: 255, b: 255}], name: 'INDONESIA', layout: 'horizontal', colorStops: [0, 0.5, 0.5, 1] },
            'UA': { colors: [{r: 0, g: 91, b: 187}, {r: 255, g: 221, b: 0}], name: 'UKRAINE', layout: 'horizontal', colorStops: [0, 0.5, 0.5, 1] },

            // Special layout flags
            'US': { colors: [{r: 178, g: 34, b: 52}, {r: 255, g: 255, b: 255}, {r: 60, g: 59, b: 110}], name: 'USA', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'CA': { colors: [{r: 255, g: 0, b: 0}, {r: 255, g: 255, b: 255}, {r: 255, g: 0, b: 0}], name: 'CANADA', layout: 'vertical', colorStops: [0, 0.25, 0.25, 0.75, 0.75, 1] },
            'ES': { colors: [{r: 170, g: 0, b: 0}, {r: 255, g: 196, b: 0}, {r: 170, g: 0, b: 0}], name: 'SPAIN', layout: 'horizontal', colorStops: [0, 0.25, 0.25, 0.75, 0.75, 1] },
            'IN': { colors: [{r: 255, g: 153, b: 51}, {r: 255, g: 255, b: 255}, {r: 18, g: 136, b: 7}], name: 'INDIA', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'AR': { colors: [{r: 116, g: 172, b: 223}, {r: 255, g: 255, b: 255}, {r: 116, g: 172, b: 223}], name: 'ARGENTINA', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'CO': { colors: [{r: 252, g: 209, b: 22}, {r: 0, g: 56, b: 168}, {r: 206, g: 17, b: 38}], name: 'COLOMBIA', layout: 'horizontal', colorStops: [0, 0.5, 0.5, 0.75, 0.75, 1] },

            // Nordic cross flags (approximated as vertical)
            'SE': { colors: [{r: 0, g: 106, b: 167}, {r: 254, g: 204, b: 0}, {r: 0, g: 106, b: 167}], name: 'SWEDEN', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'NO': { colors: [{r: 186, g: 12, b: 47}, {r: 255, g: 255, b: 255}, {r: 0, g: 40, b: 104}], name: 'NORWAY', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'FI': { colors: [{r: 255, g: 255, b: 255}, {r: 0, g: 47, b: 108}, {r: 255, g: 255, b: 255}], name: 'FINLAND', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'DK': { colors: [{r: 198, g: 12, b: 48}, {r: 255, g: 255, b: 255}, {r: 198, g: 12, b: 48}], name: 'DENMARK', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },

            // Solid with emblem (using dominant colors)
            'JP': { colors: [{r: 255, g: 255, b: 255}, {r: 188, g: 0, b: 45}, {r: 255, g: 255, b: 255}], name: 'JAPAN', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'CN': { colors: [{r: 222, g: 41, b: 16}, {r: 255, g: 222, b: 0}, {r: 222, g: 41, b: 16}], name: 'CHINA', layout: 'vertical', colorStops: [0, 0.3, 0.3, 0.7, 0.7, 1] },
            'BR': { colors: [{r: 0, g: 156, b: 59}, {r: 254, g: 223, b: 0}, {r: 0, g: 39, b: 118}], name: 'BRAZIL', layout: 'gradient', colorStops: [0, 0.4, 0.6, 1] },
            'AU': { colors: [{r: 0, g: 0, b: 139}, {r: 255, g: 255, b: 255}, {r: 255, g: 0, b: 0}], name: 'AUSTRALIA', layout: 'gradient', colorStops: [0, 0.5, 1] },
            'KR': { colors: [{r: 255, g: 255, b: 255}, {r: 205, g: 37, b: 44}, {r: 0, g: 71, b: 160}], name: 'SOUTH KOREA', layout: 'gradient', colorStops: [0, 0.5, 1] },
            'ZA': { colors: [{r: 0, g: 119, b: 73}, {r: 252, g: 209, b: 22}, {r: 222, g: 56, b: 49}, {r: 0, g: 46, b: 95}], name: 'SOUTH AFRICA', layout: 'gradient', colorStops: [0, 0.33, 0.67, 1] },
            'GB': { colors: [{r: 1, g: 33, b: 105}, {r: 255, g: 255, b: 255}, {r: 200, g: 16, b: 46}], name: 'UNITED KINGDOM', layout: 'gradient', colorStops: [0, 0.5, 1] },
            'NZ': { colors: [{r: 0, g: 36, b: 125}, {r: 204, g: 0, b: 51}, {r: 255, g: 255, b: 255}], name: 'NEW ZEALAND', layout: 'gradient', colorStops: [0, 0.5, 1] },
            'CH': { colors: [{r: 255, g: 0, b: 0}, {r: 255, g: 255, b: 255}, {r: 255, g: 0, b: 0}], name: 'SWITZERLAND', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'PT': { colors: [{r: 0, g: 102, b: 0}, {r: 255, g: 0, b: 0}], name: 'PORTUGAL', layout: 'vertical', colorStops: [0, 0.4, 0.4, 1] },
            'GR': { colors: [{r: 13, g: 94, b: 175}, {r: 255, g: 255, b: 255}, {r: 13, g: 94, b: 175}], name: 'GREECE', layout: 'horizontal', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'TR': { colors: [{r: 227, g: 10, b: 23}, {r: 255, g: 255, b: 255}, {r: 227, g: 10, b: 23}], name: 'TURKEY', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'SG': { colors: [{r: 237, g: 27, b: 46}, {r: 255, g: 255, b: 255}], name: 'SINGAPORE', layout: 'horizontal', colorStops: [0, 0.5, 0.5, 1] },
            'TH': { colors: [{r: 237, g: 28, b: 36}, {r: 255, g: 255, b: 255}, {r: 45, g: 42, b: 74}], name: 'THAILAND', layout: 'horizontal', colorStops: [0, 0.2, 0.2, 0.4, 0.4, 0.6, 0.6, 0.8, 0.8, 1] },
            'PH': { colors: [{r: 0, g: 56, b: 168}, {r: 206, g: 17, b: 38}, {r: 255, g: 255, b: 255}, {r: 252, g: 209, b: 22}], name: 'PHILIPPINES', layout: 'gradient', colorStops: [0, 0.33, 0.67, 1] },
            'MY': { colors: [{r: 204, g: 0, b: 0}, {r: 255, g: 255, b: 255}, {r: 0, g: 0, b: 128}, {r: 252, g: 196, b: 0}], name: 'MALAYSIA', layout: 'gradient', colorStops: [0, 0.33, 0.67, 1] },
            'VN': { colors: [{r: 218, g: 37, b: 29}, {r: 255, g: 255, b: 0}, {r: 218, g: 37, b: 29}], name: 'VIETNAM', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'CL': { colors: [{r: 0, g: 56, b: 168}, {r: 255, g: 255, b: 255}, {r: 215, g: 0, b: 21}], name: 'CHILE', layout: 'gradient', colorStops: [0, 0.5, 1] },
            'CZ': { colors: [{r: 17, g: 69, b: 126}, {r: 255, g: 255, b: 255}, {r: 215, g: 20, b: 26}], name: 'CZECH REPUBLIC', layout: 'gradient', colorStops: [0, 0.5, 1] },
            'IL': { colors: [{r: 0, g: 56, b: 184}, {r: 255, g: 255, b: 255}, {r: 0, g: 56, b: 184}], name: 'ISRAEL', layout: 'horizontal', colorStops: [0, 0.15, 0.15, 0.85, 0.85, 1] },
            'AE': { colors: [{r: 0, g: 122, b: 61}, {r: 255, g: 255, b: 255}, {r: 0, g: 0, b: 0}], name: 'UNITED ARAB EMIRATES', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'SA': { colors: [{r: 0, g: 98, b: 56}, {r: 255, g: 255, b: 255}, {r: 0, g: 98, b: 56}], name: 'SAUDI ARABIA', layout: 'vertical', colorStops: [0, 0.4, 0.4, 0.6, 0.6, 1] },
            'EG': { colors: [{r: 206, g: 17, b: 38}, {r: 255, g: 255, b: 255}, {r: 0, g: 0, b: 0}], name: 'EGYPT', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
            'KE': { colors: [{r: 0, g: 0, b: 0}, {r: 188, g: 20, b: 26}, {r: 0, g: 104, b: 56}], name: 'KENYA', layout: 'horizontal', colorStops: [0, 0.33, 0.33, 0.67, 0.67, 1] },
        };

        return flagColors[countryCode] || null;
    }

    setupEventListeners() {
        // Track if random mode is enabled
        this.randomMode = true;

        // Shared launch handler for both mouse and touch
        const handleLaunch = (x) => {
            if (!this.started) return;

            // Check if wallet is connected (phantomWallet is defined in phantom-integration.js)
            if (typeof phantomWallet !== 'undefined') {
                const walletStatus = phantomWallet.getStatus();

                if (walletStatus.connected) {
                    // Check if user has rockets available
                    const result = phantomWallet.useRocket();
                    if (!result.success) {
                        showNotification('No rockets remaining! Get more tokens.', 'error');
                        return;
                    }

                    // Update UI with remaining rockets
                    updateWalletUI(phantomWallet.getStatus());

                    // Set random points for this launch
                    this.userPoints = Math.floor(Math.random() * 80) + 1;
                } else {
                    // Random mode when not connected
                    if (this.randomMode) {
                        this.userPoints = Math.floor(Math.random() * 80) + 1;
                    }
                }
            } else {
                // Fallback if phantom integration not loaded
                if (this.randomMode) {
                    this.userPoints = Math.floor(Math.random() * 80) + 1;
                }
            }

            this.launchRocket(x);
        };

        // Mouse events
        document.addEventListener('mousedown', (e) => {
            handleLaunch(e.clientX);
        });

        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            if (e.touches.length > 0) {
                handleLaunch(e.touches[0].clientX);
            }
        });
    }

    // Set user points to customize firework
    setPoints(points) {
        this.userPoints = Math.max(1, points); // Minimum 1 point
    }

    // Method to launch firework from external source (for multiplayer)
    // Returns rocket data that can be synced across network
    launchFireworkFromData(x, points, fireworkTypeData = null) {
        const tempPoints = this.userPoints;
        this.userPoints = points;

        // If firework type is provided (from network), use it
        // Otherwise generate a new one
        const scale = this.getFireworkScale();
        const targetY = this.getExplosionHeight();
        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;
        const arcIntensity = heightRatio > 0.5 ? (heightRatio - 0.5) * 2 : 0;
        const horizontalDrift = (Math.random() - 0.5) * (50 + arcIntensity * 250);
        const baseVelocity = 400 + (heightRatio * 2000);
        const velocityVariation = Math.random() * 400;
        const verticalVelocity = -(baseVelocity + velocityVariation) * Math.sqrt(scale);

        let fireworkType;
        if (fireworkTypeData) {
            fireworkType = fireworkTypeData;
        } else {
            fireworkType = this.randomFireworkType();
        }

        const rocket = {
            x: x,
            y: this.canvas.height + 20, // Start below viewport for smooth entry
            vx: horizontalDrift,
            vy: verticalVelocity,
            targetY: targetY,
            trail: [],
            color: fireworkType.color,
            secondaryColor: fireworkType.secondaryColor || fireworkType.color,
            tertiaryColor: fireworkType.tertiaryColor || fireworkType.color,
            quaternaryColor: fireworkType.quaternaryColor || fireworkType.color,
            fireworkType: fireworkType.type,
            drip: fireworkType.drip,
            countryName: fireworkType.countryName || null,
            exploded: false,
            scale: scale
        };

        this.rockets.push(rocket);
        this.userPoints = tempPoints;

        // Return serializable data for network sync
        return {
            x: x,
            points: points,
            fireworkType: fireworkType
        };
    }

    // Calculate firework properties based on points
    getFireworkScale() {
        // Remapped: 1 points = smallest, 80 points = largest
        // Clamp to the new range
        const clampedPoints = Math.max(1, Math.min(80, this.userPoints));

        // Linear interpolation from 1 to 80
        // 1 points: 0.2x (smallest)
        // 80 points: 1.5x (much smaller max)
        const minScale = 0.2;
        const maxScale = 1.5;

        const normalizedValue = (clampedPoints - 1) / (80 - 1);
        return minScale + (normalizedValue * (maxScale - minScale));
    }

    getExplosionHeight() {
        // Direct linear correlation: more points = higher explosion
        // Remapped to 1-80 range - size 80 reaches max height
        const clampedPoints = Math.max(1, Math.min(80, this.userPoints));

        // Make fireworks travel much higher up the screen with safe top spacing
        const minHeight = 0.75; // 75% of screen (low start)
        const maxHeight = 0.15; // 15% of screen (safe spacing at top)

        // Linear interpolation based on clamped points
        const normalizedValue = (clampedPoints - 1) / (80 - 1);
        const heightRatio = minHeight - (normalizedValue * (minHeight - maxHeight));

        // Add small random variation (±3%)
        const variation = (Math.random() - 0.5) * 0.06;

        return this.canvas.height * Math.max(maxHeight, Math.min(minHeight, heightRatio + variation));
    }

    getTextSize() {
        // Remapped: 1 points = smallest text, 80 points = largest text
        const clampedPoints = Math.max(1, Math.min(80, this.userPoints));

        // Linear interpolation from 1 to 80
        // 1 points: 12px (smallest readable)
        // 80 points: 120px (much smaller max)
        const minTextSize = 12;
        const maxTextSize = 120;

        const normalizedValue = (clampedPoints - 1) / (80 - 1);
        return minTextSize + (normalizedValue * (maxTextSize - minTextSize));
    }

    launchRocket(x) {
        const scale = this.getFireworkScale();
        const targetY = this.getExplosionHeight();

        // Calculate height difference to determine arc intensity
        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;

        // For tall fireworks, add significant horizontal arc
        // Higher explosions get more arc (up to 300px horizontal drift)
        const arcIntensity = heightRatio > 0.5 ? (heightRatio - 0.5) * 2 : 0;
        const horizontalDrift = (Math.random() - 0.5) * (50 + arcIntensity * 250);

        // Increase velocity based on height - taller targets need EXTREME speed
        // Base velocity increases massively for tall shots to reach top of screen
        const baseVelocity = 400 + (heightRatio * 2000); // Up to 2400 for extreme heights
        const velocityVariation = Math.random() * 400;
        const verticalVelocity = -(baseVelocity + velocityVariation) * Math.sqrt(scale);

        // Get firework type (classic or standard)
        const fireworkType = this.randomFireworkType();

        // Launch from bottom of screen at clicked X position
        const rocket = {
            x: x,
            y: this.canvas.height + 20, // Start below viewport for smooth entry
            vx: horizontalDrift,
            vy: verticalVelocity,
            targetY: targetY,
            trail: [],
            color: fireworkType.color,
            secondaryColor: fireworkType.secondaryColor || fireworkType.color,
            tertiaryColor: fireworkType.tertiaryColor || fireworkType.color,
            quaternaryColor: fireworkType.quaternaryColor || fireworkType.color,
            fireworkType: fireworkType.type,
            drip: fireworkType.drip,
            countryName: fireworkType.countryName || null,
            exploded: false,
            scale: scale
        };

        this.rockets.push(rocket);

        // Broadcast to other users if sync is enabled
        if (window.fireworkSync && window.fireworkSync.isConnected) {
            window.fireworkSync.broadcastFirework(x, this.canvas.height + 20, targetY, fireworkType, scale);
        }

        // Return data for multiplayer sync
        return {
            x: x,
            points: this.userPoints,
            fireworkType: fireworkType
        };
    }

    // Launch a firework at specific coordinates (for remote sync)
    launchFireworkAt(x, y, targetY, fireworkType, scale) {
        // Calculate height difference to determine arc intensity
        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;

        // For tall fireworks, add significant horizontal arc
        const arcIntensity = heightRatio > 0.5 ? (heightRatio - 0.5) * 2 : 0;
        const horizontalDrift = (Math.random() - 0.5) * (50 + arcIntensity * 250);

        // Increase velocity based on height
        const baseVelocity = 400 + (heightRatio * 2000);
        const velocityVariation = Math.random() * 400;
        const verticalVelocity = -(baseVelocity + velocityVariation) * Math.sqrt(scale);

        // Create the rocket
        const rocket = {
            x: x,
            y: y,
            vx: horizontalDrift,
            vy: verticalVelocity,
            targetY: targetY,
            trail: [],
            color: fireworkType.color,
            secondaryColor: fireworkType.secondaryColor || fireworkType.color,
            tertiaryColor: fireworkType.tertiaryColor || fireworkType.color,
            quaternaryColor: fireworkType.quaternaryColor || fireworkType.color,
            fireworkType: fireworkType.type,
            drip: fireworkType.drip,
            countryName: fireworkType.countryName || null,
            exploded: false,
            scale: scale
        };

        this.rockets.push(rocket);
    }

    randomFireworkType() {
        const rand = Math.random();

        // 15% chance for country-themed fireworks (if country detected)
        if (rand < 0.15 && this.countryColors) {
            const colors = this.countryColors.colors;
            return {
                type: 'country',
                color: colors[0],
                secondaryColor: colors[1] || colors[0],
                tertiaryColor: colors[2] || colors[1] || colors[0],
                quaternaryColor: colors[3] || colors[2] || colors[1] || colors[0],
                drip: false,
                countryName: this.countryColors.name
            };
        }

        // 25% chance for classic fireworks (gold, white, silver with dripping)
        if (rand < 0.4) {
            const classicTypes = [
                {
                    type: 'classic-gold',
                    color: { r: 255, g: 215, b: 0 },
                    secondaryColor: { r: 255, g: 250, b: 240 },
                    drip: true
                },
                {
                    type: 'classic-white',
                    color: { r: 255, g: 255, b: 255 },
                    secondaryColor: { r: 240, g: 240, b: 255 },
                    drip: true
                },
                {
                    type: 'classic-silver',
                    color: { r: 192, g: 192, b: 192 },
                    secondaryColor: { r: 255, g: 255, b: 255 },
                    drip: true
                }
            ];
            return classicTypes[Math.floor(Math.random() * classicTypes.length)];
        }

        // 60% chance for standard colorful fireworks (NO GREEN)
        const colors = [
            { r: 255, g: 50, b: 80 },    // Red
            { r: 255, g: 200, b: 50 },   // Bright Gold
            { r: 50, g: 200, b: 255 },   // Blue
            { r: 255, g: 100, b: 255 },  // Pink
            { r: 150, g: 100, b: 255 },  // Purple
            { r: 255, g: 150, b: 50 },   // Orange
            { r: 255, g: 80, b: 120 },   // Coral
            { r: 200, g: 100, b: 255 },  // Lavender
            { r: 100, g: 255, b: 255 },  // Cyan
            { r: 255, g: 255, b: 100 },  // Yellow
        ];
        return {
            type: 'standard',
            color: colors[Math.floor(Math.random() * colors.length)],
            drip: false
        };
    }

    getRandomWord() {
        if (customWords.length === 0) {
            return null; // No words, no text
        }
        return customWords[Math.floor(Math.random() * customWords.length)];
    }

    explodeRocket(rocket) {
        rocket.exploded = true;

        const scale = rocket.scale;
        const isClassic = rocket.drip;
        const isGold = rocket.fireworkType === 'classic-gold';
        const isCountry = rocket.fireworkType === 'country';

        let baseParticleCount;
        if (isGold) {
            baseParticleCount = 150;
        } else if (isCountry) {
            baseParticleCount = 120; // More particles for country flags
        } else {
            baseParticleCount = 80;
        }

        const particleCount = Math.floor(baseParticleCount * scale) + Math.floor(Math.random() * 60 * scale);
        const explosionType = Math.random();

        // Create explosion particles using object pooling
        for (let i = 0; i < particleCount; i++) {
            let angle, speed;

            if (explosionType < 0.3) {
                angle = (Math.PI * 2 * i) / particleCount;
                speed = (150 + Math.random() * 100) * scale;
            } else if (explosionType < 0.6) {
                angle = (Math.PI * 2 * i) / particleCount;
                speed = (200 + Math.random() * 50) * scale;
            } else {
                angle = Math.random() * Math.PI * 2;
                speed = (100 + Math.random() * 150) * scale;
            }

            const particle = this.getParticle();

            // Country-themed fireworks use flag colors
            if (isCountry) {
                const colorChoice = Math.random();
                if (colorChoice < 0.25) {
                    particle.color = rocket.color;
                } else if (colorChoice < 0.5) {
                    particle.color = rocket.secondaryColor;
                } else if (colorChoice < 0.75) {
                    particle.color = rocket.tertiaryColor;
                } else {
                    particle.color = rocket.quaternaryColor;
                }
                particle.decay = 0.012 + Math.random() * 0.008;
                particle.gravity = 60 + Math.random() * 60;
                particle.size = (2 + Math.random() * 3) * scale;
                particle.drip = false;
            }
            // Classic fireworks have special dripping behavior
            else if (isClassic) {
                // Gold fireworks have enhanced sparkle with more color variation
                if (isGold) {
                    const colorVariation = Math.random();
                    if (colorVariation < 0.4) {
                        particle.color = rocket.color; // Pure gold
                    } else if (colorVariation < 0.7) {
                        particle.color = rocket.secondaryColor; // Cream white
                    } else {
                        // Bright golden white sparkle
                        particle.color = { r: 255, g: 240, b: 200 };
                    }
                    particle.size = (2 + Math.random() * 4) * scale; // Varied particle sizes for complexity
                } else {
                    // Other classic types
                    particle.color = Math.random() < 0.5 ? rocket.color : rocket.secondaryColor;
                    particle.size = (3 + Math.random() * 3) * scale;
                }

                particle.decay = 0.008 + Math.random() * 0.005; // Slower decay for dripping
                particle.gravity = 150 + Math.random() * 100; // Higher gravity for dripping effect
                particle.drip = true;
            }
            // Standard fireworks
            else {
                particle.color = rocket.color;
                particle.decay = 0.015 + Math.random() * 0.01;
                particle.gravity = 50 + Math.random() * 50;
                particle.size = (2 + Math.random() * 2) * scale;
                particle.drip = false;
            }

            particle.x = rocket.x;
            particle.y = rocket.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 1.0;
            particle.trail = [];

            this.particles.push(particle);
        }

        // Add extra golden sparkle layer for gold fireworks
        if (isGold) {
            const sparkleCount = Math.floor(50 * scale);
            for (let i = 0; i < sparkleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (80 + Math.random() * 120) * scale;

                const particle = this.getParticle();
                particle.x = rocket.x;
                particle.y = rocket.y;
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                particle.color = { r: 255, g: 250, b: 230 }; // Bright white-gold
                particle.life = 1.0;
                particle.decay = 0.012;
                particle.size = (1 + Math.random() * 2) * scale;
                particle.gravity = 200 + Math.random() * 50;
                particle.trail = [];
                particle.drip = true;

                this.particles.push(particle);
            }
        }

        // Create text particle using object pooling
        // For country fireworks, always show country name
        // For others, use random word (only if words exist)
        let word = null;
        let isCountryText = false;
        if (isCountry && rocket.countryName) {
            word = rocket.countryName;
            isCountryText = true;
        } else {
            word = this.getRandomWord();
        }

        if (word !== null) {
            const textSize = this.getTextSize();

            const textParticle = this.getTextParticle();
            textParticle.x = rocket.x;
            textParticle.y = rocket.y;
            textParticle.vy = -50 * scale; // Float upward
            textParticle.text = word;
            textParticle.size = textSize;
            textParticle.color = rocket.color;
            textParticle.life = 1.0;
            textParticle.decay = 0.008;
            textParticle.scale = 0.1; // Start small and grow

            // Store flag colors for gradient rendering
            textParticle.isCountryText = isCountryText;
            if (isCountryText) {
                textParticle.flagColors = [
                    rocket.color,
                    rocket.secondaryColor,
                    rocket.tertiaryColor,
                    rocket.quaternaryColor
                ];
                // Store layout and color stop information
                textParticle.flagLayout = this.countryColors.layout || 'gradient';
                textParticle.colorStops = this.countryColors.colorStops || null;
            }

            this.textParticles.push(textParticle);
        }

        // Secondary sparks for larger fireworks
        if (scale > 1.5 && Math.random() < 0.5) {
            setTimeout(() => {
                const sparkCount = Math.floor(30 * scale);
                for (let i = 0; i < sparkCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = (80 + Math.random() * 80) * scale;

                    const particle = this.getParticle();
                    particle.x = rocket.x;
                    particle.y = rocket.y;
                    particle.vx = Math.cos(angle) * speed;
                    particle.vy = Math.sin(angle) * speed;
                    particle.color = { r: 255, g: 255, b: 255 };
                    particle.life = 1.0;
                    particle.decay = 0.02;
                    particle.size = 1.5 * scale;
                    particle.gravity = 100;
                    particle.trail = [];
                    particle.drip = false;

                    this.particles.push(particle);
                }
            }, 200);
        }
    }

    update(deltaTime) {
        if (!this.started) return;

        // Update rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];

            if (!rocket.exploded) {
                rocket.vy += 200 * deltaTime;
                rocket.x += rocket.vx * deltaTime;
                rocket.y += rocket.vy * deltaTime;

                rocket.trail.unshift({ x: rocket.x, y: rocket.y });
                if (rocket.trail.length > 20) {
                    rocket.trail.pop();
                }

                if (rocket.y <= rocket.targetY || rocket.vy > 0) {
                    this.explodeRocket(rocket);
                }
            } else {
                this.rockets.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.vy += particle.gravity * deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            // Limit trail length based on whether it's a dripping particle
            const maxTrailLength = particle.drip ? 10 : 5;
            particle.trail.unshift({ x: particle.x, y: particle.y, life: particle.life });
            if (particle.trail.length > maxTrailLength) {
                particle.trail.pop();
            }

            particle.life -= particle.decay;

            if (particle.life <= 0) {
                const deadParticle = this.particles.splice(i, 1)[0];
                this.releaseParticle(deadParticle); // Return to pool
            }
        }

        // Update text particles
        for (let i = this.textParticles.length - 1; i >= 0; i--) {
            const text = this.textParticles[i];

            text.y += text.vy * deltaTime;
            text.vy *= 0.95; // Slow down

            // Grow scale from 0.1 to 1.0
            if (text.scale < 1.0) {
                text.scale = Math.min(1.0, text.scale + deltaTime * 3);
            }

            text.life -= text.decay;

            if (text.life <= 0) {
                const deadText = this.textParticles.splice(i, 1)[0];
                this.releaseTextParticle(deadText); // Return to pool
            }
        }
    }

    render() {
        // Clear to pure black (no fade/trail effect)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        for (const star of this.stars) {
            this.ctx.save();
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            // Twinkle effect
            star.opacity += star.twinkleSpeed;
            if (star.opacity > 0.8 || star.opacity < 0.3) {
                star.twinkleSpeed *= -1;
            }
        }

        // Draw moon
        const moonX = this.canvas.width - 120;
        const moonY = 80;
        const moonRadius = 35;

        this.ctx.save();
        this.ctx.fillStyle = '#f4f1de';
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = '#f4f1de';
        this.ctx.beginPath();
        this.ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        if (!this.started) return;

        // Draw rockets
        for (const rocket of this.rockets) {
            if (rocket.exploded) continue;

            // Draw rocket trail as a fading line (white with orange hints)
            if (rocket.trail.length > 0) {
                // Draw trail segments with fading opacity
                for (let i = 0; i < rocket.trail.length - 1; i++) {
                    const point = rocket.trail[i];
                    const nextPoint = rocket.trail[i + 1];
                    const opacity = 1 - (i / rocket.trail.length);

                    // Mix white and orange for trail (mostly white with some orange)
                    const isOrange = Math.random() < 0.3; // 30% chance for orange
                    const trailColor = isOrange
                        ? { r: 255, g: 150, b: 80 }  // Orange flame
                        : { r: 255, g: 255, b: 255 }; // White smoke

                    this.ctx.save();
                    this.ctx.globalAlpha = opacity * 0.7;
                    this.ctx.strokeStyle = `rgb(${trailColor.r}, ${trailColor.g}, ${trailColor.b})`;
                    this.ctx.lineWidth = 2 * rocket.scale * opacity;
                    this.ctx.lineCap = 'round';
                    this.ctx.shadowBlur = 8 * opacity;
                    this.ctx.shadowColor = `rgb(${trailColor.r}, ${trailColor.g}, ${trailColor.b})`;

                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y);
                    this.ctx.lineTo(nextPoint.x, nextPoint.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }

                // Draw one final line segment from the last trail point to the current rocket position
                if (rocket.trail.length > 0) {
                    const lastPoint = rocket.trail[0];
                    const trailColor = Math.random() < 0.3
                        ? { r: 255, g: 150, b: 80 }  // Orange flame
                        : { r: 255, g: 255, b: 255 }; // White smoke

                    this.ctx.save();
                    this.ctx.globalAlpha = 0.9;
                    this.ctx.strokeStyle = `rgb(${trailColor.r}, ${trailColor.g}, ${trailColor.b})`;
                    this.ctx.lineWidth = 2 * rocket.scale;
                    this.ctx.lineCap = 'round';
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = `rgb(${trailColor.r}, ${trailColor.g}, ${trailColor.b})`;

                    this.ctx.beginPath();
                    this.ctx.moveTo(lastPoint.x, lastPoint.y);
                    this.ctx.lineTo(rocket.x, rocket.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }

        // Draw particles
        for (const particle of this.particles) {
            for (let i = 0; i < particle.trail.length; i++) {
                const point = particle.trail[i];
                const trailOpacity = point.life * (1 - (i / particle.trail.length));

                this.ctx.save();
                this.ctx.globalAlpha = trailOpacity * 0.6;
                this.ctx.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, particle.size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
            this.ctx.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw text particles
        for (const text of this.textParticles) {
            this.ctx.save();
            this.ctx.globalAlpha = text.life;
            this.ctx.font = `bold ${text.size * text.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // For country text, use white text with colored glow from first flag color
            if (text.isCountryText && text.flagColors) {
                // Use first flag color for the glow/stroke
                const glowColor = text.flagColors[0];

                // Stroke (outline) with flag color
                this.ctx.strokeStyle = `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`;
                this.ctx.lineWidth = Math.max(3, text.size * text.scale * 0.06);
                this.ctx.shadowBlur = 30;
                this.ctx.shadowColor = `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`;
                this.ctx.strokeText(text.text, text.x, text.y);

                // Fill with white
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowBlur = 40;
                this.ctx.shadowColor = '#ffffff';
                this.ctx.fillText(text.text, text.x, text.y);
            } else {
                // Standard text rendering for non-country fireworks
                // Stroke (outline)
                this.ctx.strokeStyle = `rgb(${text.color.r}, ${text.color.g}, ${text.color.b})`;
                this.ctx.lineWidth = Math.max(2, text.size * text.scale * 0.05);
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = `rgb(${text.color.r}, ${text.color.g}, ${text.color.b})`;
                this.ctx.strokeText(text.text, text.x, text.y);

                // Fill
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowBlur = 30;
                this.ctx.fillText(text.text, text.x, text.y);
            }

            this.ctx.restore();
        }

        // Draw city silhouette from pre-generated data (drawn last so rockets appear behind)

        // Add ambient city glow at the horizon (low kelvin warm light)
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height - 150, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(60, 30, 10, 0)'); // Transparent at top
        gradient.addColorStop(0.5, 'rgba(80, 35, 15, 0.15)'); // Subtle warm glow
        gradient.addColorStop(1, 'rgba(100, 40, 20, 0.25)'); // More intense at bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.canvas.height - 150, this.canvas.width, 150);

        for (const building of this.cityBuildings) {
            const y = this.canvas.height - building.height;

            // Building body with depth layers
            // Back layer (darker for depth)
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.fillRect(building.x - 2, y - 2, building.width + 4, building.height + 2);

            // Main building body
            this.ctx.fillStyle = '#0d0d0d';
            this.ctx.fillRect(building.x, y, building.width, building.height);

            // Add depth with multiple edge highlights
            this.ctx.fillStyle = '#111111';
            this.ctx.fillRect(building.x, y, 2, building.height); // Left highlight

            this.ctx.fillStyle = '#060606';
            this.ctx.fillRect(building.x + building.width - 2, y, 2, building.height); // Right shadow

            // Top edge subtle highlight
            this.ctx.fillStyle = '#101010';
            this.ctx.fillRect(building.x, y, building.width, 1);

            // Windows with warm red/orange glow and dynamic on/off behavior
            for (const window of building.windows) {
                // Smoothly transition brightness to target
                const transitionSpeed = 0.01; // Slower transition
                if (Math.abs(window.brightness - window.targetBrightness) > 0.01) {
                    if (window.brightness < window.targetBrightness) {
                        window.brightness = Math.min(window.brightness + transitionSpeed, window.targetBrightness);
                    } else {
                        window.brightness = Math.max(window.brightness - transitionSpeed, window.targetBrightness);
                    }
                }

                // Glimmer effect when on (very subtle)
                if (window.isOn && window.brightness > 0.1) {
                    window.targetBrightness += window.glimmerSpeed;
                    if (window.targetBrightness > 0.9 || window.targetBrightness < 0.6) {
                        window.glimmerSpeed *= -1;
                    }
                }

                // Random on/off behavior (very slow)
                window.flickerTimer += 0.016; // ~60fps
                if (window.flickerTimer >= window.flickerInterval) {
                    window.flickerTimer = 0;
                    window.flickerInterval = 20 + Math.random() * 40; // New random interval

                    // Toggle window on/off
                    window.isOn = !window.isOn;
                    window.targetBrightness = window.isOn ? (Math.random() * 0.3 + 0.6) : 0;
                }

                // Only render if brightness is above threshold
                if (window.brightness > 0.05) {
                    // Warm red/orange fade only (lower kelvin - 2000K-2500K range)
                    const red = Math.floor(255 * window.brightness);
                    const orange = Math.floor(60 + (window.brightness * 80)); // 60-140 (more red, less green)
                    const windowColor = `rgb(${red}, ${orange}, 0)`; // No blue/green, pure warm tone

                    this.ctx.save();
                    this.ctx.fillStyle = windowColor;
                    // Subtle glow for warm ambience
                    this.ctx.shadowBlur = 6 * window.brightness;
                    this.ctx.shadowColor = windowColor;
                    // Smaller windows (3x5 instead of 5x7)
                    this.ctx.fillRect(
                        building.x + window.x,
                        y + window.y,
                        3,
                        5
                    );
                    this.ctx.restore();
                }
            }
        }
    }

    startAnimation() {
        let lastTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;

            this.update(deltaTime);
            this.render();

            requestAnimationFrame(animate);
        };

        animate();
    }
}

let fireworks;

// Customizable word list - empty by default
let customWords = [];

window.addEventListener('load', () => {
    const canvas = document.getElementById('fireworksCanvas');
    fireworks = new FireworksDisplay(canvas);
    renderWordList();
});

// M key to toggle menu, S key to toggle wallet panel
document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
        toggleMenu();
    }

    if (e.key === 's' || e.key === 'S') {
        toggleWalletPanel();
    }

    // Enter key in input to add word
    if (e.key === 'Enter' && document.getElementById('newWordInput') === document.activeElement) {
        addWord();
    }
});

function startFireworks() {
    document.getElementById('startScreen').classList.add('hidden');
    fireworks.started = true;
}

function toggleMenu() {
    const menu = document.getElementById('wordMenu');
    menu.classList.toggle('hidden');
}

function toggleWalletPanel() {
    const walletPanel = document.getElementById('walletPanel');
    walletPanel.classList.toggle('hidden');
}

function renderWordList() {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';

    customWords.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';

        const wordText = document.createElement('span');
        wordText.className = 'word-text';
        wordText.textContent = word;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-word-btn';
        removeBtn.textContent = 'X';
        removeBtn.onclick = () => removeWord(index);

        wordItem.appendChild(wordText);
        wordItem.appendChild(removeBtn);
        wordList.appendChild(wordItem);
    });
}

function addWord() {
    const input = document.getElementById('newWordInput');
    const newWord = input.value.trim().toUpperCase();

    if (newWord && !customWords.includes(newWord)) {
        customWords.push(newWord);
        renderWordList();
        input.value = '';
    }
}

function removeWord(index) {
    customWords.splice(index, 1);
    renderWordList();
}

// Function to set user points (call this from outside)
function setUserPoints(points) {
    if (fireworks) {
        fireworks.setPoints(points);
    }
}

// Preset button handler
function setPreset(value) {
    if (value === 'random') {
        fireworks.randomMode = true;
        document.getElementById('pointsValue').textContent = 'Random';
        document.getElementById('pointsSlider').disabled = true;
        document.getElementById('pointsSlider').style.opacity = '0.5';
    } else {
        fireworks.randomMode = false;
        fireworks.setPoints(value);
        document.getElementById('pointsValue').textContent = value;
        document.getElementById('pointsSlider').value = value;
        document.getElementById('pointsSlider').disabled = false;
        document.getElementById('pointsSlider').style.opacity = '1';
    }
}

// Slider event listener
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('pointsSlider');
    if (slider) {
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            fireworks.randomMode = false;
            fireworks.setPoints(value);
            document.getElementById('pointsValue').textContent = value;
        });

        // Disable slider initially (random mode is default)
        slider.disabled = true;
        slider.style.opacity = '0.5';
    }
});

// Custom Cursor Controller
class CustomCursor {
    constructor() {
        this.cursor = document.getElementById('customCursor');
        this.mouseX = 0;
        this.mouseY = 0;
        this.cursorX = 0;
        this.cursorY = 0;
        this.isActive = false;

        this.init();
    }

    init() {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Track mouse down/up for active state
        document.addEventListener('mousedown', () => {
            this.isActive = true;
            this.cursor.classList.add('active');
        });

        document.addEventListener('mouseup', () => {
            this.isActive = false;
            this.cursor.classList.remove('active');
        });

        // Start animation loop
        this.animate();
    }

    animate() {
        // Fast following with minimal lag
        const ease = 0.5;
        this.cursorX += (this.mouseX - this.cursorX) * ease;
        this.cursorY += (this.mouseY - this.cursorY) * ease;

        // Update cursor position
        this.cursor.style.left = this.cursorX + 'px';
        this.cursor.style.top = this.cursorY + 'px';

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize custom cursor
window.addEventListener('load', () => {
    new CustomCursor();
});
