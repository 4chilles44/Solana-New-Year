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

        // Setup canvas FIRST before generating background elements
        this.setupCanvas();

        // Background elements (generated after canvas is sized)
        this.stars = [];
        this.generateStars();
        this.cityBuildings = [];
        this.generateCity();

        this.setupEventListeners();
        this.startAnimation();
    }

    // Generate random stars
    generateStars() {
        const starCount = 250; // More stars for 2.5x larger canvas
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width, // Use canvas width
                y: Math.random() * (this.canvas.height * 0.4), // Top 40% of canvas
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    // Generate static city silhouette that spans full width
    generateCity() {
        this.cityBuildings = [];
        const cityHeight = this.canvas.height * 0.165; // Use canvas height
        const buildingWidths = [60, 80, 50, 90, 70, 85, 60, 75, 55, 80, 65, 90, 100, 45];

        let currentX = 0;
        let buildingIndex = 0;

        // Generate buildings to fill the entire canvas width
        while (currentX < this.canvas.width) { // Use canvas width
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
        // Enlarge canvas for "zoomed out" effect to match -67% browser zoom
        // -67% zoom = 33% of original = shows 3x content, so we need ~2.5x canvas
        const canvasScale = 2.5;
        this.canvas.width = window.innerWidth * canvasScale;
        this.canvas.height = window.innerHeight * canvasScale;

        // Store the actual viewport size for positioning
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        this.canvasScale = canvasScale;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth * canvasScale;
            this.canvas.height = window.innerHeight * canvasScale;
            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight;
            // Regenerate background elements for new dimensions
            this.stars = [];
            this.generateStars();
            this.cityBuildings = [];
            this.generateCity();
        });
    }

    setupEventListeners() {
        // Track if random mode is enabled
        this.randomMode = true;

        // Track free rocket usage (only 1 free rocket allowed)
        this.freeRocketUsed = false;

        // Shared launch handler for both mouse and touch
        const handleLaunch = (x, y) => {
            if (!this.started) return;

            // Check regular shot cooldown (4 seconds for everyone)
            if (!regularShotReady) {
                const remaining = Math.max(0, regularShotCooldownEndTime - Date.now());
                console.log(`Regular shot on cooldown: ${(remaining / 1000).toFixed(1)}s remaining`);
                return;
            }

            // If tier test mode is enabled, bypass wallet checks
            const tierTestCheckbox = document.getElementById('testTierCheckbox');
            const isTierTesting = tierTestCheckbox && tierTestCheckbox.checked;

            if (isTierTesting) {
                // Unlimited rockets in test mode (universal 4s cooldown handled above)
                this.userPoints = Math.floor(Math.random() * 80) + 1;
                this.launchRocket(x, y); // Pass Y coordinate for aiming

                // Start regular shot cooldown
                regularShotReady = false;
                regularShotCooldownEndTime = Date.now() + REGULAR_SHOT_COOLDOWN;
                setTimeout(() => {
                    regularShotReady = true;
                }, REGULAR_SHOT_COOLDOWN);

                return;
            }

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
                    // Not connected - allow 1 free demo rocket
                    if (!this.freeRocketUsed) {
                        // First rocket is free - special Solana demo rocket
                        this.freeRocketUsed = true;
                        this.launchSolanaDemo(x);
                        return;
                    } else {
                        // Show token requirement message
                        showTokenRequirementMessage();
                        return;
                    }
                }
            } else {
                // Fallback if phantom integration not loaded - allow 1 free rocket
                if (!this.freeRocketUsed) {
                    this.freeRocketUsed = true;
                    this.launchSolanaDemo(x);
                    return;
                } else {
                    showTokenRequirementMessage();
                    return;
                }
            }

            this.launchRocket(x, y); // Pass Y for aiming
        };

        // Mouse events
        document.addEventListener('mousedown', (e) => {
            // Left-click only
            if (e.button === 0) {
                // Scale mouse coordinates to match canvas size
                const scaledX = e.clientX * this.canvasScale;
                const scaledY = e.clientY * this.canvasScale;
                handleLaunch(scaledX, scaledY);
            }
        });

        // Right-click handler for top 15 users (small rapid rockets)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Always prevent context menu

            if (!this.started) return;

            // Top 15 holders (excluding King) get small rapid rockets on right-click
            const tierInfo = window.tierSystem?.getUserTier();
            if (tierInfo && tierInfo.rank && tierInfo.rank <= 15 && tierInfo.rank > 1) {
                // Check if top 15 rocket is on cooldown
                if (!top15RocketReady) {
                    const remaining = Math.max(0, top15RocketCooldownEndTime - Date.now());
                    console.log(`Top 15 rocket on cooldown: ${(remaining / 1000).toFixed(1)}s remaining`);
                    return;
                }

                const scaledX = e.clientX * this.canvasScale;
                const scaledY = e.clientY * this.canvasScale;
                this.fireTop15Rocket(scaledX, scaledY);

                // Start 5-second cooldown
                top15RocketReady = false;
                top15RocketCooldownEndTime = Date.now() + TOP15_ROCKET_COOLDOWN;
                setTimeout(() => {
                    top15RocketReady = true;
                }, TOP15_ROCKET_COOLDOWN);
            }
            // King's right-click is handled in initCannonTracking
        });

        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            if (e.touches.length > 0) {
                // Scale touch coordinates to match canvas size
                const scaledX = e.touches[0].clientX * this.canvasScale;
                const scaledY = e.touches[0].clientY * this.canvasScale;
                handleLaunch(scaledX, scaledY);
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

    // Top 15 rapid-fire rocket (small size = 0.44, same as minimum)
    fireTop15Rocket(x, clickY) {
        // Hardcoded small size for rapid fire (matches rank #100 minimum)
        const scale = 0.44;
        const textSizeMultiplier = 0.44;
        const targetY = clickY || (this.canvas.height * 0.5); // Aim at click or middle

        // Calculate velocity for target
        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;
        const horizontalDrift = 0; // Accurate aiming
        const baseVelocity = 400 + (heightRatio * 2000);
        const velocityVariation = Math.random() * 400;
        const verticalVelocity = -(baseVelocity + velocityVariation) * Math.sqrt(Math.max(scale, 0.5));

        const fireworkType = this.randomFireworkType();

        const rocket = {
            x: x,
            y: this.canvas.height + 20,
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
            scale: scale,
            textScale: textSizeMultiplier,
            selectedWord: this.getRandomWord()
        };

        this.rockets.push(rocket);
    }

    launchRocket(x, clickY = null) {
        // Get tier-based properties if tier system is available
        let scale, targetY, textSizeMultiplier, maxHeight;

        if (window.tierSystem) {
            const tierInfo = window.tierSystem.getUserTier();

            if (tierInfo && tierInfo.rocketSize) {
                scale = tierInfo.rocketSize; // 0.008-8.0 based on rank
                textSizeMultiplier = tierInfo.textSize; // 0.008-5.0 based on rank

                // Top 15% (percentile <= 15) can aim ANYWHERE
                // Lower tiers have max height caps
                const canAimAnywhere = tierInfo.percentile <= 15;

                if (canAimAnywhere) {
                    // Top 15%: aim wherever they click, or use default height
                    if (clickY !== null) {
                        targetY = clickY;
                    } else {
                        targetY = this.canvas.height * tierInfo.rocketHeight;
                    }
                } else {
                    // Lower tiers: capped at max height
                    maxHeight = this.canvas.height * tierInfo.rocketHeight; // 0.05-0.95
                    if (clickY !== null) {
                        targetY = Math.max(clickY, maxHeight); // Can't go higher than tier allows
                    } else {
                        targetY = maxHeight;
                    }
                }
            } else {
                // Fallback if tier not available
                scale = this.getFireworkScale();
                targetY = this.getExplosionHeight();
                textSizeMultiplier = 1.0;
            }
        } else {
            // No tier system, use old random method
            scale = this.getFireworkScale();
            targetY = this.getExplosionHeight();
            textSizeMultiplier = 1.0;
        }

        // Calculate height difference to determine arc intensity
        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;

        // Aim directly at X position (no random drift for accurate aiming)
        const horizontalDrift = 0;

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
            scale: scale,
            textScale: textSizeMultiplier // Store for text sizing
        };

        // Pre-select the word for this rocket so we can broadcast it
        if (fireworkType.type === 'country' && rocket.countryName) {
            rocket.selectedWord = rocket.countryName;
        } else {
            rocket.selectedWord = this.getRandomWord();
        }

        // Add special emojis for top 10 holders (New Year & wealth themed)
        const tierInfo = window.tierSystem?.getUserTier();
        if (tierInfo && tierInfo.rank <= 10 && showRankEmoji) { // Check showRankEmoji setting
            let emoji = '';

            // Assign emoji based on rank
            switch(tierInfo.rank) {
                case 1:
                    emoji = '👑'; // Crown - King
                    rocket.isTopHolder = true;
                    break;
                case 2:
                    emoji = '🍾'; // Champagne bottle - Second place luxury
                    break;
                case 3:
                    emoji = '✨'; // Sparkles - Third place magic
                    break;
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                    emoji = '🥂'; // Champagne glass - Top 10 celebration
                    break;
            }

            if (rocket.selectedWord) {
                // Emoji above words if text exists
                rocket.selectedWord = emoji + ' ' + rocket.selectedWord;
            } else {
                // Emoji in middle if no text
                rocket.selectedWord = emoji;
            }
        }

        this.rockets.push(rocket);

        // Broadcast to other users if sync is enabled
        if (window.fireworkSync && window.fireworkSync.isConnected) {
            window.fireworkSync.broadcastFirework(x, this.canvas.height + 20, targetY, fireworkType, scale, rocket.selectedWord, rocket.isTopHolder);
        }

        // Return data for multiplayer sync
        return {
            x: x,
            points: this.userPoints,
            fireworkType: fireworkType
        };
    }

    // Launch special Solana demo rocket (sized like rank #55, says "Solana")
    launchSolanaDemo(x) {
        // Official Solana brand gradient colors (from logo)
        const solanaColors = {
            magenta: { r: 220, g: 31, b: 255 },   // #DC1FFF (left side)
            blue: { r: 131, g: 145, b: 255 },     // #8391FF (middle)
            cyan: { r: 0, g: 255, b: 199 }        // #00FFC7 (right side)
        };

        // Use properties that match rank #55 (mid-tier sizing and height)
        const scale = 0.204; // Rank 55 scale
        const textScale = 1.37; // Rank 55 text size
        const targetY = this.canvas.height * 0.639; // Rank 55 height (64% up screen)

        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;

        // Minimal horizontal drift
        const horizontalDrift = (Math.random() - 0.5) * 20;

        // Calculate velocity based on height (like regular rockets)
        const baseVelocity = 400 + (heightRatio * 2000);
        const verticalVelocity = -(baseVelocity);

        const rocket = {
            x: x,
            y: this.canvas.height + 20,
            vx: horizontalDrift,
            vy: verticalVelocity,
            targetY: targetY,
            trail: [],
            color: solanaColors.magenta,
            secondaryColor: solanaColors.blue,
            tertiaryColor: solanaColors.cyan,
            quaternaryColor: solanaColors.blue,
            fireworkType: 'standard',
            drip: false,
            countryName: null,
            exploded: false,
            scale: scale, // Rank 55 scale
            selectedWord: 'SOLANA', // Always says "Solana"
            isSolanaDemo: true, // Mark as demo rocket
            // Store Solana gradient info for text rendering
            solanaGradient: true,
            solanaColors: [solanaColors.magenta, solanaColors.blue, solanaColors.cyan],
            textScale: textScale // Rank 55 text size
        };

        this.rockets.push(rocket);

        // No notification after first rocket - user will discover on their own
    }

    // Launch special rank rocket that shows user's holder number
    launchRankRocket(x, rank) {
        // Gold colors for rank rocket
        const rankColors = {
            gold: { r: 255, g: 215, b: 0 },      // Gold
            orange: { r: 255, g: 140, b: 0 }     // Dark Orange
        };

        // Medium height rocket
        const targetY = this.canvas.height * 0.4; // 60% up the screen
        const heightDiff = this.canvas.height - targetY;
        const heightRatio = heightDiff / this.canvas.height;

        // Minimal horizontal drift for center launch
        const horizontalDrift = (Math.random() - 0.5) * 30;

        // Medium velocity
        const baseVelocity = 400 + (heightRatio * 1500);
        const verticalVelocity = -(baseVelocity);

        const rocket = {
            x: x,
            y: this.canvas.height + 20,
            vx: horizontalDrift,
            vy: verticalVelocity,
            targetY: targetY,
            trail: [],
            color: `rgb(${rankColors.gold.r}, ${rankColors.gold.g}, ${rankColors.gold.b})`,
            secondaryColor: `rgb(${rankColors.orange.r}, ${rankColors.orange.g}, ${rankColors.orange.b})`,
            tertiaryColor: `rgb(${rankColors.gold.r}, ${rankColors.gold.g}, ${rankColors.gold.b})`,
            quaternaryColor: `rgb(${rankColors.orange.r}, ${rankColors.orange.g}, ${rankColors.orange.b})`,
            fireworkType: 'standard',
            drip: false,
            countryName: null,
            exploded: false,
            scale: 0.8, // Medium scale
            selectedWord: `#${rank}`, // Show rank number
            isRankRocket: true // Mark as rank rocket
        };

        this.rockets.push(rocket);

        // Broadcast to other users if sync is enabled
        if (window.fireworkSync && window.fireworkSync.isConnected) {
            window.fireworkSync.broadcastFirework(x, this.canvas.height + 20, targetY, {
                color: rocket.color,
                secondaryColor: rocket.secondaryColor,
                tertiaryColor: rocket.tertiaryColor,
                quaternaryColor: rocket.quaternaryColor,
                type: 'standard',
                drip: false
            }, 0.8, `#${rank}`);
        }
    }

    // Launch a firework at specific coordinates (for remote sync)
    launchFireworkAt(x, y, targetY, fireworkType, scale, word, isTopHolder) {
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
            scale: scale,
            selectedWord: word,  // Use the word sent from the remote user
            isTopHolder: isTopHolder  // Mark if from top holder
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
        if (window.customWords.length === 0) {
            return null; // No words, no text
        }
        return window.customWords[Math.floor(Math.random() * window.customWords.length)];
    }

    explodeRocket(rocket) {
        rocket.exploded = true;

        // Check if this is a mega-crown or big-crown explosion (object type)
        const isMegaCrown = typeof rocket.fireworkType === 'object' &&
            (rocket.fireworkType.type === 'mega-crown' || rocket.fireworkType.type === 'big-crown');

        if (isMegaCrown) {
            console.log('💥 Creating mega/big crown explosion!');
            this.createMegaCrownExplosion(rocket);
            return;
        }

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

            // Solana demo rockets use Solana gradient colors with slow, beautiful fall
            if (rocket.solanaGradient) {
                const colorChoice = Math.random();
                if (colorChoice < 0.33) {
                    particle.color = rocket.color; // Magenta
                } else if (colorChoice < 0.67) {
                    particle.color = rocket.secondaryColor; // Blue
                } else {
                    particle.color = rocket.tertiaryColor; // Cyan
                }
                // Much slower decay for longer-lasting particles
                particle.decay = 0.005 + Math.random() * 0.003; // Slower decay
                // Lower gravity for graceful, slow fall
                particle.gravity = 20 + Math.random() * 30; // Gentler gravity
                // Particle size fully controlled by scale (no minimum)
                particle.size = (0.5 + Math.random() * 1.5) * scale * 4;
                particle.drip = true; // Enable drip for nice trailing effect
            }
            // Country-themed fireworks use flag colors
            else if (isCountry) {
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
                particle.size = (0.5 + Math.random() * 1.5) * scale * 3.3;
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
                    particle.size = (0.5 + Math.random() * 1.5) * scale * 4; // Varied particle sizes for complexity
                } else {
                    // Other classic types
                    particle.color = Math.random() < 0.5 ? rocket.color : rocket.secondaryColor;
                    particle.size = (0.5 + Math.random() * 1.5) * scale * 4;
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
                particle.size = (0.5 + Math.random() * 1.5) * scale * 2.7;
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
                particle.size = (0.5 + Math.random() * 1.5) * scale * 2;
                particle.gravity = 200 + Math.random() * 50;
                particle.trail = [];
                particle.drip = true;

                this.particles.push(particle);
            }
        }

        // Create text particle using object pooling
        // For country fireworks, always show country name
        // Use pre-selected word (already chosen during launch)
        let word = rocket.selectedWord || null;
        let isCountryText = isCountry && rocket.countryName;

        if (word !== null) {
            let textSize;

            // If tier system is active and textScale is set, use fixed base size
            if (rocket.textScale && window.tierSystem) {
                // Fixed base size of 60px, scaled by tier
                textSize = 60 * rocket.textScale;
            } else {
                // Fallback to old points-based sizing
                textSize = this.getTextSize();
                if (rocket.textScale) {
                    textSize = textSize * rocket.textScale;
                }
            }

            const textParticle = this.getTextParticle();
            textParticle.x = rocket.x;
            textParticle.y = rocket.y;
            textParticle.vy = -50 * scale; // Float upward
            textParticle.text = word;
            textParticle.size = textSize;
            textParticle.color = rocket.color;
            textParticle.life = 1.0;
            textParticle.decay = 0.008;

            // Solana text starts larger and more visible
            if (rocket.solanaGradient) {
                textParticle.scale = 0.8; // Start much larger for immediate visibility
            } else {
                textParticle.scale = 0.1; // Start small and grow
            }

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

            // Store Solana gradient info for special rendering
            textParticle.isSolanaText = rocket.solanaGradient || false;
            if (rocket.solanaGradient) {
                textParticle.solanaColors = rocket.solanaColors;
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
                    particle.size = scale * 1.5;
                    particle.gravity = 100;
                    particle.trail = [];
                    particle.drip = false;

                    this.particles.push(particle);
                }
            }, 200);
        }
    }

    createMegaCrownExplosion(rocket) {
        // TRULY MASSIVE explosion with multiple layers
        const fireworkType = rocket.fireworkType;
        const scale = fireworkType.scale || 12.0;
        const particleCount = fireworkType.particleCount || 2000;

        // Screen shake effect
        const shakeIntensity = 15;
        const shakeEl = document.body;
        shakeEl.style.animation = 'none';
        requestAnimationFrame(() => {
            shakeEl.style.animation = `screenShake 0.5s cubic-bezier(.36,.07,.19,.97) both`;
        });

        // Fire background flash effect
        createFireBackgroundFlash();

        // Layer 1: Massive outer ring - slowest, longest lasting
        for (let i = 0; i < particleCount * 0.4; i++) {
            const angle = (Math.PI * 2 * i) / (particleCount * 0.4);
            const speed = (300 + Math.random() * 200) * scale;

            const particle = this.getParticle();
            particle.x = rocket.x;
            particle.y = rocket.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.color = { r: 255, g: 215, b: 0 }; // Pure gold
            particle.life = 1.0;
            particle.decay = 0.0003; // EXTREMELY slow fade - lasts forever
            particle.size = (4 + Math.random() * 6) * scale * 0.3;
            particle.gravity = 15 + Math.random() * 10; // Super low gravity
            particle.trail = [];
            particle.drip = true;

            this.particles.push(particle);
        }

        // Layer 2: Mid ring - faster, golden sparkles
        for (let i = 0; i < particleCount * 0.3; i++) {
            const angle = (Math.PI * 2 * i) / (particleCount * 0.3);
            const speed = (250 + Math.random() * 150) * scale;

            const particle = this.getParticle();
            particle.x = rocket.x;
            particle.y = rocket.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.color = { r: 255, g: 250, b: 240 }; // Cream white
            particle.life = 1.0;
            particle.decay = 0.0004; // Ultra slow
            particle.size = (3 + Math.random() * 5) * scale * 0.3;
            particle.gravity = 20 + Math.random() * 15;
            particle.trail = [];
            particle.drip = true;

            this.particles.push(particle);
        }

        // Layer 3: Inner burst - random, chaotic, bright
        for (let i = 0; i < particleCount * 0.3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (150 + Math.random() * 250) * scale;

            const particle = this.getParticle();
            particle.x = rocket.x;
            particle.y = rocket.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;

            // Mix of gold and orange
            const colorChoice = Math.random();
            if (colorChoice < 0.5) {
                particle.color = { r: 255, g: 215, b: 0 };
            } else {
                particle.color = { r: 255, g: 140, b: 0 };
            }

            particle.life = 1.0;
            particle.decay = 0.0005; // Ultra slow
            particle.size = (2 + Math.random() * 4) * scale * 0.3;
            particle.gravity = 25 + Math.random() * 20;
            particle.trail = [];
            particle.drip = true;

            this.particles.push(particle);
        }

        // Shockwave rings - expanding circles
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                const ringParticles = 150;
                const ringRadius = 50 + (ring * 100);
                for (let i = 0; i < ringParticles; i++) {
                    const angle = (Math.PI * 2 * i) / ringParticles;

                    const particle = this.getParticle();
                    particle.x = rocket.x + Math.cos(angle) * ringRadius;
                    particle.y = rocket.y + Math.sin(angle) * ringRadius;
                    particle.vx = Math.cos(angle) * (400 + ring * 100) * scale * 0.5;
                    particle.vy = Math.sin(angle) * (400 + ring * 100) * scale * 0.5;
                    particle.color = { r: 255, g: 255, b: 100 }; // Bright yellow
                    particle.life = 1.0;
                    particle.decay = 0.015;
                    particle.size = (2 + Math.random() * 3) * scale * 0.2;
                    particle.gravity = 20;
                    particle.trail = [];
                    particle.drip = false;

                    this.particles.push(particle);
                }
            }, ring * 100);
        }

        // Check if we have a custom message (not just crown emoji)
        const hasCustomMessage = fireworkType.text && fireworkType.text !== '👑' && fireworkType.text.trim().length > 0;

        if (hasCustomMessage) {
            // Create TWO text particles positioned as a single centered unit
            // Like a div: crown at top, text flowing below

            // First, prepare the message and calculate its size
            const messageText = fireworkType.text;

            // Split long text into multiple lines
            const maxCharsPerLine = 20;
            let processedText = messageText;
            let lineCount = 1;

            if (messageText.length > maxCharsPerLine) {
                const words = messageText.split(' ');
                const lines = [];
                let currentLine = '';

                for (const word of words) {
                    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine) lines.push(currentLine);

                processedText = lines.join('\n');
                lineCount = lines.length;
            }

            // Calculate message size based on text length
            const textLength = processedText.replace(/\n/g, '').length;
            let messageSize;
            if (textLength > 30) {
                messageSize = Math.max(60, 200 - (textLength * 2));
            } else if (textLength > 15) {
                messageSize = 100;
            } else if (textLength > 5) {
                messageSize = 150;
            } else {
                messageSize = 200;
            }

            // Crown size (larger and more prominent)
            const crownSize = 250;

            // Calculate total height of the "div" (crown + gap + message)
            const crownHeight = crownSize * 1.0; // Crown takes up its full size
            const gapBetween = 40; // Small gap between crown and message
            const messageLineHeight = messageSize * 1.0 * 1.2; // Line height for message
            const messageTotalHeight = messageLineHeight * lineCount;
            const totalDivHeight = crownHeight + gapBetween + messageTotalHeight;

            // Position the "div" so it's centered on the explosion point
            const divTopY = rocket.y - (totalDivHeight / 2);

            // 1. Crown emoji at the TOP of the div
            const crownParticle = this.getTextParticle();
            crownParticle.x = rocket.x;
            crownParticle.y = divTopY + (crownHeight / 2); // Center crown in its space
            crownParticle.vy = -30 * scale * 0.1; // Float upward slowly
            crownParticle.text = '👑';
            crownParticle.size = crownSize;
            crownParticle.color = { r: 255, g: 215, b: 0 };
            crownParticle.life = 1.0;
            crownParticle.decay = 0.0012;
            crownParticle.scale = 1.0;
            crownParticle.isGiantText = true;
            this.textParticles.push(crownParticle);

            // 2. Custom message BELOW the crown (starts after crown + gap)
            const messageParticle = this.getTextParticle();
            messageParticle.x = rocket.x;
            messageParticle.y = divTopY + crownHeight + gapBetween + (messageTotalHeight / 2);
            messageParticle.vy = -30 * scale * 0.1; // Float upward slowly (same as crown)
            messageParticle.text = processedText;
            messageParticle.isMultiLine = lineCount > 1;
            messageParticle.size = messageSize;
            messageParticle.color = { r: 255, g: 215, b: 0 };
            messageParticle.life = 1.0;
            messageParticle.decay = 0.0012;
            messageParticle.scale = 1.0;
            messageParticle.isGiantText = true;
            this.textParticles.push(messageParticle);

        } else {
            // No custom message - just show crown emoji centered on explosion
            const textParticle = this.getTextParticle();
            textParticle.x = rocket.x;
            textParticle.y = rocket.y; // Center on explosion
            textParticle.vy = -30 * scale * 0.1; // Float upward slowly
            textParticle.text = '👑';
            textParticle.size = 250; // Large crown
            textParticle.color = { r: 255, g: 215, b: 0 };
            textParticle.life = 1.0;
            textParticle.decay = 0.0012;
            textParticle.scale = 1.0;
            textParticle.isGiantText = true;
            this.textParticles.push(textParticle);
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

            // Flare particles just fade with minimal velocity damping
            if (particle.isFlare) {
                particle.vx *= 0.95; // Slight damping
                particle.vy *= 0.95;
            }

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

            // For Solana text, use gradient fill with Solana brand colors
            if (text.isSolanaText && text.solanaColors) {
                // Create horizontal gradient across text (left to right: magenta -> blue -> cyan)
                const textMetrics = this.ctx.measureText(text.text);
                const textWidth = textMetrics.width;
                const gradient = this.ctx.createLinearGradient(
                    text.x - textWidth / 2,
                    text.y,
                    text.x + textWidth / 2,
                    text.y
                );

                // Apply Solana gradient: magenta (0) -> blue (0.5) -> cyan (1)
                gradient.addColorStop(0, `rgb(${text.solanaColors[0].r}, ${text.solanaColors[0].g}, ${text.solanaColors[0].b})`);
                gradient.addColorStop(0.5, `rgb(${text.solanaColors[1].r}, ${text.solanaColors[1].g}, ${text.solanaColors[1].b})`);
                gradient.addColorStop(1, `rgb(${text.solanaColors[2].r}, ${text.solanaColors[2].g}, ${text.solanaColors[2].b})`);

                // Subtle white outline for readability (not overpowering)
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = Math.max(3, text.size * text.scale * 0.08);
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                this.ctx.strokeText(text.text, text.x, text.y);

                // Main gradient stroke with Solana colors
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = Math.max(2, text.size * text.scale * 0.05);
                this.ctx.shadowBlur = 30;
                this.ctx.shadowColor = `rgb(${text.solanaColors[0].r}, ${text.solanaColors[0].g}, ${text.solanaColors[0].b})`;
                this.ctx.strokeText(text.text, text.x, text.y);

                // Fill with vibrant gradient
                this.ctx.fillStyle = gradient;
                this.ctx.shadowBlur = 25;
                this.ctx.shadowColor = `rgb(${text.solanaColors[1].r}, ${text.solanaColors[1].g}, ${text.solanaColors[1].b})`;
                this.ctx.fillText(text.text, text.x, text.y);
            } else if (text.isCountryText && text.flagColors) {
                // For country text, use white text with colored glow from first flag color
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
                // Check if multi-line text (contains newlines)
                if (text.isMultiLine && text.text.includes('\n')) {
                    const lines = text.text.split('\n');
                    const lineHeight = text.size * text.scale * 1.2; // 1.2x line spacing
                    const totalHeight = lineHeight * (lines.length - 1);
                    const startY = text.y - (totalHeight / 2); // Center vertically

                    lines.forEach((line, index) => {
                        const lineY = startY + (index * lineHeight);

                        // Stroke (outline)
                        this.ctx.strokeStyle = `rgb(${text.color.r}, ${text.color.g}, ${text.color.b})`;
                        this.ctx.lineWidth = Math.max(2, text.size * text.scale * 0.05);
                        this.ctx.shadowBlur = 20;
                        this.ctx.shadowColor = `rgb(${text.color.r}, ${text.color.g}, ${text.color.b})`;
                        this.ctx.strokeText(line, text.x, lineY);

                        // Fill
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.shadowBlur = 30;
                        this.ctx.fillText(line, text.x, lineY);
                    });
                } else {
                    // Single line text
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

// Make fireworks globally accessible for sync
window.fireworks = null;

// Customizable word list - empty by default
// Make it global so sync can access it
window.customWords = [];

window.addEventListener('load', () => {
    const canvas = document.getElementById('fireworksCanvas');
    window.fireworks = new FireworksDisplay(canvas);
    renderWordList();
});

// M key to toggle menu, S key to toggle wallet panel
document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in input fields
    const isTyping = document.activeElement.tagName === 'INPUT' ||
                     document.activeElement.tagName === 'TEXTAREA';

    if ((e.key === 'm' || e.key === 'M') && !isTyping) {
        toggleMenu();
    }

    if ((e.key === 's' || e.key === 'S') && !isTyping) {
        // S key now launches rank rocket instead of opening wallet panel
        launchRankRocket();
    }

    // Enter key in input to add word
    if (e.key === 'Enter' && document.getElementById('newWordInput') === document.activeElement) {
        addWord();
    }
});

// Launch a special rank rocket that shows user's position
function launchRankRocket() {
    if (!window.fireworks || !window.fireworks.started) return;

    // Check if wallet is connected
    if (typeof phantomWallet !== 'undefined') {
        const walletStatus = phantomWallet.getStatus();

        if (walletStatus.connected && window.walletRankSystem) {
            // Get user's rank
            const rank = window.walletRankSystem.getRank(walletStatus.publicKey);

            if (rank) {
                // Launch rank rocket in center of screen
                const centerX = window.innerWidth / 2;
                window.fireworks.launchRankRocket(centerX, rank);
                showNotification(`You are holder #${rank}! 🏆`, 'success');
            } else {
                showNotification('Rank not found. Try reconnecting your wallet.', 'error');
            }
        } else {
            showNotification('Connect your wallet to see your rank!', 'info');
        }
    } else {
        showNotification('Wallet integration not available', 'error');
    }
}

function startFireworks() {
    document.getElementById('startScreen').classList.add('hidden');

    // Show controls guide overlay with proper animation
    const controlsGuide = document.getElementById('controlsGuide');
    if (controlsGuide) {
        // Use requestAnimationFrame to ensure proper rendering
        requestAnimationFrame(() => {
            controlsGuide.classList.add('show');
        });

        // Hide controls guide and START THE SHOW (don't show wallet guide yet)
        const hideControlsGuide = function(e) {
            if (e.target === controlsGuide) {
                controlsGuide.classList.remove('show');
                controlsGuide.removeEventListener('click', hideControlsGuide);

                // Start fireworks immediately - wallet guide will show after first free rocket
                window.fireworks.started = true;
            }
        };
        controlsGuide.addEventListener('click', hideControlsGuide);
    } else {
        // Fallback if guide doesn't exist
        window.fireworks.started = true;
    }
}

function showWalletGuide() {
    const walletGuide = document.getElementById('walletGuide');
    if (walletGuide) {
        requestAnimationFrame(() => {
            walletGuide.classList.add('show');
        });

        // Hide wallet guide when clicking outside - allow watching show without connecting
        const hideWalletGuide = function(e) {
            if (e.target === walletGuide) {
                walletGuide.classList.remove('show');
                // User can continue watching the show even without connecting
                window.fireworks.started = true;
                walletGuide.removeEventListener('click', hideWalletGuide);

                showNotification('You can watch the show, but need tokens to launch rockets!', 'info');
            }
        };
        walletGuide.addEventListener('click', hideWalletGuide);
    } else {
        window.fireworks.started = true;
    }
}

// Close wallet guide via X button
function closeWalletGuide() {
    const walletGuide = document.getElementById('walletGuide');
    if (walletGuide) {
        walletGuide.classList.remove('show');
        window.fireworks.started = true;
        showNotification('Watching the show! Press M to connect later.', 'info');
    }
}

function shareWithFriend() {
    const shareData = {
        title: 'Solana New Year 2025',
        text: 'Join me in the premium New Year celebration with custom fireworks messages! 🎆🪙',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

function fallbackShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const btn = event.target.closest('.share-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>✅ Link Copied!</span>';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
    }).catch(() => {
        alert('Share this link: ' + url);
    });
}

function toggleMenu() {
    const menu = document.getElementById('wordMenu');
    menu.classList.toggle('hidden');
}

function toggleWalletPanel() {
    const walletPanel = document.getElementById('walletPanel');
    walletPanel.classList.toggle('hidden');
}

async function connectPhantomWallet() {
    const walletGuide = document.getElementById('walletGuide');

    try {
        // Hide the onboarding guide
        if (walletGuide) {
            walletGuide.classList.remove('show');
        }

        // Connect wallet using the PhantomWalletIntegration class
        if (window.phantomWallet) {
            const result = await window.phantomWallet.connect();
            console.log('Wallet connected:', result);

            // Register wallet in rank system
            if (window.walletRankSystem) {
                const rank = await window.walletRankSystem.registerWallet(result.publicKey, result.tokenBalance);
                showNotification(`Welcome! You are holder #${rank} 🎉`, 'success');
            }

            // Start the fireworks
            window.fireworks.started = true;

            // Show success notification
            showNotification(`Connected! ${result.availableRockets} rockets available`, 'success');
        } else {
            throw new Error('Phantom integration not loaded');
        }
    } catch (error) {
        console.error('Failed to connect wallet:', error);

        // Still allow them to continue without wallet
        if (walletGuide) {
            walletGuide.classList.remove('show');
        }
        window.fireworks.started = true;

        showNotification('Wallet connection failed. Limited features available.', 'error');
    }
}

// Global flag to prevent re-triggering modal
window.connectPromptShowing = false;

// Show token requirement message when trying to launch without tokens
function showTokenRequirementMessage() {
    // Don't show if already visible
    if (window.connectPromptShowing) {
        return;
    }
    // Immediately show connect prompt (no intermediate notification)
    showConnectPrompt();
}

// Show a connect button notification
function showConnectPrompt() {
    // Don't show if already visible
    if (window.connectPromptShowing) {
        return;
    }

    // Set flag to prevent re-triggering
    window.connectPromptShowing = true;

    // Remove any existing prompts first to avoid duplicates
    const existingPrompts = document.querySelectorAll('.connect-prompt');
    existingPrompts.forEach(p => p.remove());

    // Create a custom notification with a connect button
    const notification = document.createElement('div');
    notification.className = 'notification connect-prompt';

    const content = document.createElement('div');
    content.className = 'connect-prompt-content';

    const text = document.createElement('p');
    text.textContent = 'Connect your Phantom wallet to launch more rockets!';

    const connectBtn = document.createElement('button');
    connectBtn.className = 'connect-btn-inline';
    connectBtn.textContent = 'Connect Wallet';
    connectBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        openWalletGuide();
    };

    const skipBtn = document.createElement('button');
    skipBtn.className = 'skip-btn-inline';
    skipBtn.textContent = 'Watch Only';
    skipBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        dismissConnectPrompt();
    };

    content.appendChild(text);
    content.appendChild(connectBtn);
    content.appendChild(skipBtn);

    // Stop propagation on the content div too
    content.onclick = function(e) {
        e.stopPropagation();
    };

    notification.appendChild(content);

    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(0, 29, 61, 0.98) 0%, rgba(0, 20, 45, 0.98) 100%);
        border: 3px solid rgba(138, 43, 226, 0.6);
        border-radius: 20px;
        padding: 40px;
        z-index: 10000;
        box-shadow: 0 25px 100px rgba(0, 0, 0, 0.7), 0 0 80px rgba(138, 43, 226, 0.5);
        min-width: 400px;
        text-align: center;
        pointer-events: all;
    `;

    // Stop clicks on the notification from propagating
    notification.onclick = function(e) {
        e.stopPropagation();
    };

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds if no action
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
            // Clear the flag when auto-removed
            window.connectPromptShowing = false;
        }
    }, 10000);
}

// Open wallet guide from connect button (make it global for debugging)
window.openWalletGuide = function() {
    console.log('openWalletGuide called');

    // Clear the flag
    window.connectPromptShowing = false;

    // Remove connect prompt
    const prompts = document.querySelectorAll('.connect-prompt');
    console.log('Removing', prompts.length, 'prompts');
    prompts.forEach(p => p.remove());

    // Show wallet guide
    const walletGuide = document.getElementById('walletGuide');
    console.log('walletGuide element:', walletGuide);

    if (walletGuide) {
        requestAnimationFrame(() => {
            walletGuide.classList.add('show');
            console.log('Wallet guide shown');
        });
    } else {
        console.error('Wallet guide element not found!');
    }
};

// Also keep it accessible as openWalletGuide for the onclick handlers
const openWalletGuide = window.openWalletGuide;

// Dismiss connect prompt
function dismissConnectPrompt() {
    // Clear the flag
    window.connectPromptShowing = false;

    const prompts = document.querySelectorAll('.connect-prompt');
    prompts.forEach(p => p.remove());
    showNotification('Watching the show! Press M to connect later.', 'info');
}

// Make renderWordList globally accessible for sync
window.renderWordList = function() {
    const wordList = document.getElementById('wordList');
    if (!wordList) return; // Guard if element doesn't exist yet

    wordList.innerHTML = '';

    window.customWords.forEach((word, index) => {
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

    if (newWord && !window.customWords.includes(newWord)) {
        window.customWords.push(newWord);
        window.renderWordList();
        input.value = '';
    }
}

function removeWord(index) {
    window.customWords.splice(index, 1);
    window.renderWordList();
}

// Function to set user points (call this from outside)
function setUserPoints(points) {
    if (window.fireworks) {
        window.fireworks.setPoints(points);
    }
}

// Preset button handler
function setPreset(value) {
    if (value === 'random') {
        window.fireworks.randomMode = true;
        document.getElementById('pointsValue').textContent = 'Random';
        document.getElementById('pointsSlider').disabled = true;
        document.getElementById('pointsSlider').style.opacity = '0.5';
    } else {
        window.fireworks.randomMode = false;
        window.fireworks.setPoints(value);
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
            window.fireworks.randomMode = false;
            window.fireworks.setPoints(value);
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

// ====== CROWN CANNON SYSTEM ======

// Cannon state
let cannonAngle = 0;
let mouseCannonX = window.innerWidth / 2;
let mouseCannonY = window.innerHeight / 2;

// Check if user is rank #1 (King of the Hill)
function isKingOfTheHill() {
    const tierInfo = window.tierSystem?.getUserTier();
    return tierInfo && tierInfo.rank === 1;
}

// Initialize cannon mouse tracking
function initCannonTracking() {
    const cannon = document.getElementById('crownCannon');
    if (!cannon) {
        console.error('Crown cannon element not found!');
        return;
    }

    console.log('Cannon tracking initialized');

    // Track mouse movement globally (always update coordinates)
    document.addEventListener('mousemove', (e) => {
        // Always update mouse position
        mouseCannonX = e.clientX;
        mouseCannonY = e.clientY;

        // Only move cannon visually if user is king
        if (!isKingOfTheHill()) return;

        // Slide cannon horizontally to follow mouse
        // Keep it centered on mouse X position
        const cannonWidth = 80; // Approximate cannon width
        const leftPosition = mouseCannonX - (cannonWidth / 2);

        // Constrain to screen bounds
        const maxLeft = window.innerWidth - cannonWidth;
        const constrainedLeft = Math.max(0, Math.min(maxLeft, leftPosition));

        cannon.style.left = constrainedLeft + 'px';
        cannon.style.transform = 'none'; // Remove the center transform
    });

    // Spacebar to fire BIG CANNON ROCKET (king only)
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space') return; // Only spacebar

        const isKing = isKingOfTheHill();
        if (!isKing) return;

        // Don't fire if user is typing in an input field or textarea
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );

        if (isTyping) {
            console.log('Spacebar ignored - user is typing in input field');
            return; // Allow normal space character in input
        }

        // Prevent page scroll on spacebar
        e.preventDefault();

        console.log('Spacebar pressed - King firing cannon');

        if (!window.fireworks) {
            console.error('King spacebar: fireworks not initialized');
            showNotification('Fireworks not initialized', 'error');
            return;
        }

        if (!window.fireworks.started) {
            console.warn('King spacebar: show not started');
            showNotification('Start the show first!', 'info');
            return;
        }

        if (!bigShotReady) {
            console.log('King spacebar: big shot on cooldown');
            return;
        }

        // Get message from input
        const messageInput = document.getElementById('cannonMessageText');
        const message = messageInput?.value.trim() || '';

        console.log('✅ King firing big cannon rocket at', mouseCannonX, mouseCannonY, 'with message:', message);

        // Scale mouse coordinates to canvas size
        const canvasScale = window.fireworks?.canvasScale || 2.5;
        const scaledX = mouseCannonX * canvasScale;
        const scaledY = mouseCannonY * canvasScale;

        console.log('Scaled coordinates:', scaledX, scaledY);

        // Fire big queued rocket with message
        fireBigQueuedRocket(scaledX, scaledY, message);

        // Don't clear the input - keep the message saved for next shot
        // User can manually edit it if they want to change it
    });

    // Right-click to toggle fire flare cursor trail
    let fireFlareActive = false;
    document.addEventListener('contextmenu', (e) => {
        if (!isKingOfTheHill()) return;

        e.preventDefault(); // Prevent context menu

        // Toggle fire flare
        fireFlareActive = !fireFlareActive;
        if (fireFlareActive) {
            showNotification('Fire Flare: ON', 'success');
            startFireFlare();
        } else {
            showNotification('Fire Flare: OFF', 'info');
            stopFireFlare();
        }
    });
}

// Big shot cooldown and queue system
let bigShotReady = true;
let bigShotCooldownTimer = null;
let bigShotCooldownEndTime = 0;

// Regular shot cooldown system (4 seconds for everyone)
let regularShotReady = true;
let regularShotCooldownEndTime = 0;
const REGULAR_SHOT_COOLDOWN = 4000; // 4 seconds

// Top 15 rapid rocket cooldown system (5 seconds for ranks 2-15)
let top15RocketReady = true;
let top15RocketCooldownEndTime = 0;
const TOP15_ROCKET_COOLDOWN = 5000; // 5 seconds

// Fire BIG queued rocket (aims where you click)
function fireBigQueuedRocket(targetX, targetY, message = '') {
    console.log('🚀 fireBigQueuedRocket called with:', targetX, targetY, 'message:', message);

    if (!window.fireworks || !window.fireworks.started) {
        console.error('Fireworks not ready:', { fireworks: !!window.fireworks, started: window.fireworks?.started });
        showNotification('Start the show first!', 'info');
        return;
    }

    // Check if big shot is ready
    if (!bigShotReady) {
        console.log('Big shot on cooldown');
        return;
    }

    console.log('✅ Launching big rocket!');

    // Start cooldown (30 seconds)
    bigShotReady = false;
    bigShotCooldownEndTime = Date.now() + 30000;
    startBigShotCooldown();

    // Launch big firework aimed at mouse position
    if (window.fireworks) {
        // Big golden explosion
        const bigColors = {
            gold: { r: 255, g: 215, b: 0 },
            orange: { r: 255, g: 140, b: 0 }
        };

        // Get canvas dimensions
        const canvasWidth = window.fireworks.canvas.width;
        const canvasHeight = window.fireworks.canvas.height;

        // Aim at mouse Y position (already scaled)
        const aimY = targetY;
        const heightDiff = canvasHeight - aimY;
        const heightRatio = heightDiff / canvasHeight;

        const horizontalDrift = (targetX - canvasWidth / 2) * 0.5;
        const baseVelocity = 400 + (heightRatio * 2000);
        const verticalVelocity = -(baseVelocity);

        // Use custom message if provided, otherwise use crown emoji
        const displayText = message || '👑';

        const rocket = {
            x: canvasWidth / 2, // Launch from center of canvas
            y: canvasHeight,
            vx: horizontalDrift * 0.3,
            vy: verticalVelocity,
            targetY: aimY,
            exploded: false,
            trail: [],
            maxTrailLength: 80,
            trailHue: 50,
            isBigShot: true,
            selectedWord: displayText, // Custom message for cannon shot
            fireworkType: {
                type: 'big-crown',
                colors: bigColors,
                particleCount: 800, // Big but not mega
                scale: 6.0, // Large scale
                text: displayText, // Use custom message
                layered: true,
                shockwave: true
            }
        };

        window.fireworks.rockets.push(rocket);

        // Broadcast big shot
        if (window.fireworkSync && window.fireworkSync.isConnected) {
            window.fireworkSync.broadcastFirework(
                window.innerWidth / 2,
                window.innerHeight,
                aimY,
                rocket.fireworkType,
                6.0,
                '👑',
                true
            );
        }
    }
}

// Fire Flare System - Small meteor with trail following mouse
let fireFlareInterval = null;
let fireFlareParticles = [];

function startFireFlare() {
    if (fireFlareInterval) return; // Already running

    fireFlareInterval = setInterval(() => {
        if (!window.fireworks || !isKingOfTheHill()) {
            stopFireFlare();
            return;
        }

        // Get scaled mouse position for canvas
        const scaledX = mouseCannonX * (window.fireworks.canvasScale || 2.5);
        const scaledY = mouseCannonY * (window.fireworks.canvasScale || 2.5);

        // Create small trail particles behind the cursor (meteor effect)
        for (let i = 0; i < 2; i++) {
            const particle = window.fireworks.getParticle();

            // Spawn particles directly at mouse with small random offset
            particle.x = scaledX + (Math.random() - 0.5) * 10;
            particle.y = scaledY + (Math.random() - 0.5) * 10;

            // Very small initial velocity for tight trail
            particle.vx = (Math.random() - 0.5) * 20;
            particle.vy = (Math.random() - 0.5) * 20;

            // Solana gradient colors - magenta, purple, cyan
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                particle.color = { r: 220, g: 31, b: 255 }; // Magenta
            } else if (colorChoice < 0.66) {
                particle.color = { r: 156, g: 39, b: 176 }; // Purple
            } else {
                particle.color = { r: 0, g: 255, b: 255 }; // Cyan
            }

            particle.life = 1.0;
            particle.decay = 0.04; // Quick fade for short trail
            particle.size = 2 + Math.random() * 3; // Small particles
            particle.gravity = 0; // No gravity, just fade
            particle.trail = [];
            particle.drip = false;

            // Mark as flare particle (no celestial gravity)
            particle.isFlare = true;

            window.fireworks.particles.push(particle);
        }
    }, 30); // Emit particles every 30ms for smooth trail
}

function stopFireFlare() {
    if (fireFlareInterval) {
        clearInterval(fireFlareInterval);
        fireFlareInterval = null;
    }
}

// Fire TINY rapid rocket - goes HIGH but is ABSOLUTELY TINY
function fireTinyRapidRocket(targetX) {
    if (window.fireworks) {
        // TINY gold rocket that travels very high but is MICROSCOPIC
        const crownColors = {
            gold: { r: 255, g: 215, b: 0 },
            orange: { r: 255, g: 165, b: 0 }
        };

        // Goes VERY HIGH (5-15% from top)
        const targetY = window.innerHeight * (0.05 + Math.random() * 0.1); // 5-15% from top
        const heightDiff = window.innerHeight - targetY;
        const heightRatio = heightDiff / window.innerHeight;

        const horizontalDrift = (targetX - window.innerWidth / 2) * 0.5;
        const baseVelocity = 400 + (heightRatio * 2000);
        const verticalVelocity = -(baseVelocity);

        const rocket = {
            x: window.innerWidth / 2, // Launch from center (cannon position)
            y: window.innerHeight,
            vx: horizontalDrift * 0.3,
            vy: verticalVelocity,
            targetY: targetY,
            exploded: false,
            trail: [],
            maxTrailLength: 15,
            trailHue: 45,
            fireworkType: {
                type: 'tiny-rapid',
                colors: crownColors,
                particleCount: 20,  // Very few particles
                scale: 0.02,        // ABSOLUTELY TINY (2% scale!)
                text: '👑',
                textScale: 0.02     // MICROSCOPIC text
            }
        };

        window.fireworks.rockets.push(rocket);

        // Broadcast tiny rocket to other users
        if (window.fireworkSync && window.fireworkSync.isConnected) {
            window.fireworkSync.broadcastFirework(
                window.innerWidth / 2,
                window.innerHeight,
                targetY,
                rocket.fireworkType,
                0.02,
                '👑',
                true  // isTopHolder = true for tiny rocket
            );
        }
    }
}

// Start 30-second big shot cooldown (visual in circular UI only)
function startBigShotCooldown() {
    const cooldownDuration = 30000; // 30 seconds

    // Set timer for 30 seconds
    bigShotCooldownTimer = setTimeout(() => {
        bigShotReady = true;
    }, cooldownDuration);
}

// ============================================
// TIER SYSTEM UI INTEGRATION
// ============================================

// Update tier display panel
function updateTierDisplay() {
    if (!window.tierSystem) return;

    const tierInfo = window.tierSystem.getUserTier();
    const tierPanel = document.getElementById('tierPanel');
    const tierName = document.getElementById('tierName');
    const tierRank = document.getElementById('tierRank');
    const tierPercentile = document.getElementById('tierPercentile');
    const tierFeatures = document.getElementById('tierFeatures');
    const cannon = document.getElementById('crownCannon');

    if (!tierPanel) return;

    // Show/hide panel
    if (tierInfo.name === 'Not Connected' || tierInfo.name === 'Locked') {
        tierPanel.classList.add('hidden');
        if (cannon) cannon.style.display = 'none';
        return;
    }

    tierPanel.classList.remove('hidden');

    // Show/hide cannon based on rank
    const cannonMessageSection = document.getElementById('cannonMessageSection');
    if (cannon) {
        if (tierInfo.rank === 1) {
            cannon.style.display = 'flex';
            // Show cannon message input in menu
            if (cannonMessageSection) {
                cannonMessageSection.style.display = 'block';
            }
            // Update king's name on cannon
            if (window.updateKingCannonName) {
                window.updateKingCannonName();
            }
        } else {
            cannon.style.display = 'none';
            // Hide cannon message input
            if (cannonMessageSection) {
                cannonMessageSection.style.display = 'none';
            }
        }
    }

    // Update tier name with color
    tierName.textContent = tierInfo.name;
    tierName.style.color = window.tierSystem.getTierColor(tierInfo.name);

    // Update rank only
    if (tierInfo.rank) {
        tierRank.textContent = `#${tierInfo.rank}`;
    }

    // Remove features display (keeping code structure but not populating)
    if (false && tierInfo.features) {
        let featuresHTML = '';

        if (tierInfo.name === 'King of the Hill') {
            featuresHTML = `
                <div class="tier-feature-item">Massive Cannon</div>
                <div class="tier-feature-item">Auto Mega Shot (60s)</div>
                <div class="tier-feature-item">Right-Click Fireballs</div>
                <div class="tier-feature-item">Golden Aura</div>
                <div class="tier-feature-item">Crown Banner</div>
            `;
        } else if (tierInfo.name === 'Apex') {
            featuresHTML = `
                <div class="tier-feature-item">Whale Companions</div>
                <div class="tier-feature-item">Glowing Text + Emoji</div>
                <div class="tier-feature-item">Priority Rendering</div>
                <div class="tier-feature-item">${tierInfo.particleCount} particles</div>
            `;
        } else if (tierInfo.name === 'Inferno') {
            featuresHTML = `
                <div class="tier-feature-item">Dolphin/Orb Trail</div>
                <div class="tier-feature-item">Animated Text</div>
                <div class="tier-feature-item">Cluster Burst</div>
                <div class="tier-feature-item">3s Cooldown</div>
            `;
        } else if (tierInfo.name === 'Blaze') {
            featuresHTML = `
                <div class="tier-feature-item">Shooting Stars</div>
                <div class="tier-feature-item">Multi-Stage Rocket</div>
                <div class="tier-feature-item">5s Cooldown</div>
            `;
        } else if (tierInfo.name === 'Flame') {
            featuresHTML = `
                <div class="tier-feature-item">Trailing Sparks</div>
                <div class="tier-feature-item">Bold Text</div>
                <div class="tier-feature-item">10s Cooldown</div>
            `;
        } else {
            featuresHTML = `
                <div class="tier-feature-item">Basic Sparklers</div>
                <div class="tier-feature-item">Unlimited Firing</div>
            `;
        }

        tierFeatures.innerHTML = featuresHTML;
    }
}

// Make it globally accessible
window.updateTierDisplay = updateTierDisplay;

// Cycle tier rank for testing
function cycleTierUp() {
    if (window.tierSystem) {
        window.tierSystem.cycleTestRank(1);
        showNotification(`Test Rank: #${window.tierSystem.testRank}`, 'info');
    }
}

function cycleTierDown() {
    if (window.tierSystem) {
        window.tierSystem.cycleTestRank(-1);
        showNotification(`Test Rank: #${window.tierSystem.testRank}`, 'info');
    }
}

// Show/hide tier test controls
function toggleTierTestControls(show) {
    const controls = document.getElementById('tierTestControls');
    if (controls) {
        controls.style.display = show ? 'flex' : 'none';
    }
}

// Separate tier test toggle function
function toggleTierTest(enabled) {
    // Show/hide tier testing controls
    toggleTierTestControls(enabled);

    // Enable/disable tier test mode
    if (enabled && window.tierSystem) {
        window.tierSystem.setTestRank(1, 100); // Start as #1 out of 100
        updateTierDisplay();
    } else if (window.tierSystem) {
        window.tierSystem.disableTestMode();
        updateTierDisplay();
    }
}

// Make globally accessible
window.toggleTierTest = toggleTierTest;

// Keyboard shortcuts for tier testing
document.addEventListener('keydown', (e) => {
    // Only work when tier test mode is enabled
    const tierTestCheckbox = document.getElementById('testTierCheckbox');
    if (!tierTestCheckbox || !tierTestCheckbox.checked) return;

    // Arrow keys to cycle rank
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        cycleTierUp();
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        cycleTierDown();
    }
    // Number keys for quick rank jumps
    else if (e.key >= '1' && e.key <= '9' && e.ctrlKey) {
        e.preventDefault();
        const rank = parseInt(e.key);
        if (window.tierSystem) {
            window.tierSystem.setTestRank(rank, 100);
            showNotification(`Test Rank: #${rank}`, 'info');
        }
    }
});

// ============================================
// FIRE BACKGROUND ANIMATION FOR KING LAUNCH
// ============================================

function createFireBackgroundFlash() {
    // Create fullscreen fire overlay
    const fireOverlay = document.createElement('div');
    fireOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
        background: radial-gradient(ellipse at bottom,
            rgba(255, 100, 0, 0.4) 0%,
            rgba(255, 165, 0, 0.3) 20%,
            rgba(255, 69, 0, 0.2) 40%,
            transparent 70%);
        animation: fireFlash 1.5s ease-out forwards;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fireFlash {
            0% {
                opacity: 0;
                transform: scale(0.8);
            }
            20% {
                opacity: 1;
                transform: scale(1.1);
            }
            100% {
                opacity: 0;
                transform: scale(1.5);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(fireOverlay);

    // Remove after animation
    setTimeout(() => {
        fireOverlay.remove();
    }, 1500);
}

// ============================================
// TIER CONFIGURATION EDITOR
// ============================================

function toggleTierEditor() {
    const panel = document.getElementById('tierEditorPanel');
    if (!panel) return;

    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        loadCurrentTierValues();
    } else {
        panel.classList.add('hidden');
    }
}

function loadCurrentTierValues() {
    if (!window.tierSystem || !window.tierSystem.tierConfig) return;

    const tierInfo = window.tierSystem.getUserTier();
    const rank = tierInfo.rank || 1;

    const tierData = window.tierSystem.tierConfig.find(t => t.rank === rank);
    if (!tierData) return;

    document.getElementById('editorCurrentRank').textContent = rank;
    document.getElementById('editorMaxHeight').value = tierData.maxHeight;
    document.getElementById('editorMaxFontSize').value = tierData.maxFontSize;
    document.getElementById('editorMaxRocketSize').value = tierData.maxRocketSize;

    updateEditorValueDisplays();

    // Update value displays when inputs change
    document.getElementById('editorMaxHeight').oninput = updateEditorValueDisplays;
    document.getElementById('editorMaxFontSize').oninput = updateEditorValueDisplays;
    document.getElementById('editorMaxRocketSize').oninput = updateEditorValueDisplays;
}

function updateEditorValueDisplays() {
    const height = document.getElementById('editorMaxHeight').value;
    const fontSize = document.getElementById('editorMaxFontSize').value;
    const rocketSize = document.getElementById('editorMaxRocketSize').value;

    document.getElementById('editorMaxHeightValue').textContent = height;
    document.getElementById('editorMaxFontSizeValue').textContent = fontSize;
    document.getElementById('editorMaxRocketSizeValue').textContent = rocketSize;
}

function applyTierEdits() {
    if (!window.tierSystem || !window.tierSystem.tierConfig) {
        showNotification('Tier config not loaded yet', 'error');
        return;
    }

    const tierInfo = window.tierSystem.getUserTier();
    const rank = tierInfo.rank || 1;

    const tierData = window.tierSystem.tierConfig.find(t => t.rank === rank);
    if (!tierData) return;

    // Update the config in memory
    tierData.maxHeight = parseFloat(document.getElementById('editorMaxHeight').value);
    tierData.maxFontSize = parseFloat(document.getElementById('editorMaxFontSize').value);
    tierData.maxRocketSize = parseFloat(document.getElementById('editorMaxRocketSize').value);

    showNotification(`Rank ${rank} updated! Use "Download Config" to save.`, 'success');

    // Refresh the tier display
    updateTierDisplay();
}

function downloadTierConfig() {
    if (!window.tierSystem || !window.tierSystem.tierConfig) {
        showNotification('No config to download', 'error');
        return;
    }

    const config = {
        tiers: window.tierSystem.tierConfig,
        description: "Tier configuration for rocket fireworks. maxHeight: 0.0 (top of screen) to 1.0 (bottom), maxFontSize: text multiplier, maxRocketSize: explosion size multiplier"
    };

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'tier-config.json';
    a.click();

    URL.revokeObjectURL(url);
    showNotification('Config downloaded! Replace the file to apply changes.', 'success');
}

// ====== USER NAME SYSTEM ======
let userName = localStorage.getItem('userName') || 'Anonymous';

function saveName() {
    const nameInput = document.getElementById('userNameInput');
    const newName = nameInput.value.trim();
    
    if (newName && newName.length > 0) {
        userName = newName.substring(0, 20); // Max 20 chars
        localStorage.setItem('userName', userName);
        showNotification('Name saved: ' + userName, 'success');
        
        // Update king cannon name if user is king
        updateKingCannonName();
    } else {
        showNotification('Please enter a valid name', 'info');
    }
}

function updateKingCannonName() {
    const cannonNameEl = document.getElementById('cannonName');
    if (cannonNameEl && window.tierSystem) {
        const tierInfo = window.tierSystem.getUserTier();
        if (tierInfo && tierInfo.rank === 1) {
            cannonNameEl.textContent = userName;
        }
    }
}

// Load saved name on page load
window.addEventListener('load', () => {
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
        nameInput.value = userName;
    }
});

// ====== COOLDOWN TIMER SYSTEM ======
let cooldownInterval = null;

function startCooldownTimer(durationMs) {
    const cooldownDisplay = document.getElementById('cooldownDisplay');
    const cooldownTimer = document.getElementById('cooldownTimer');
    
    if (!cooldownDisplay || !cooldownTimer) return;
    
    // Show cooldown display
    cooldownDisplay.style.display = 'block';
    
    const endTime = Date.now() + durationMs;
    
    // Clear existing interval
    if (cooldownInterval) {
        clearInterval(cooldownInterval);
    }
    
    // Update every 100ms for smooth countdown
    cooldownInterval = setInterval(() => {
        const remaining = endTime - Date.now();
        
        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            cooldownInterval = null;
            cooldownTimer.textContent = 'Ready!';
            cooldownTimer.classList.add('ready');
            
            // Hide after a moment
            setTimeout(() => {
                if (cooldownDisplay) {
                    cooldownDisplay.style.display = 'none';
                }
            }, 1000);
        } else {
            cooldownTimer.classList.remove('ready');
            const seconds = (remaining / 1000).toFixed(1);
            cooldownTimer.textContent = seconds + 's';
        }
    }, 100);
}

// ====== LEADERBOARD SYSTEM ======
function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const leaderboardPanel = document.getElementById('leaderboardPanel');
    
    if (!leaderboardList || !window.tierSystem) return;
    
    // Get all wallets sorted by balance
    const wallets = Array.from(window.tierSystem.wallets.entries())
        .map(([address, data]) => ({
            address,
            balance: data.balance,
            holderNumber: data.holderNumber,
            name: data.name || `Holder #${data.holderNumber}`
        }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 15); // Top 15
    
    if (wallets.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-item loading">No holders yet</div>';
        return;
    }
    
    // Show leaderboard panel
    if (leaderboardPanel) {
        leaderboardPanel.classList.remove('hidden');
    }
    
    // Build leaderboard HTML
    leaderboardList.innerHTML = wallets.map((wallet, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : '';
        const displayName = wallet.name || userName || `Holder #${wallet.holderNumber}`;
        const tokens = (wallet.balance / 1000000).toFixed(1) + 'M';
        
        return `
            <div class="leaderboard-item ${rankClass}">
                <span class="leaderboard-rank">#${rank}</span>
                <span class="leaderboard-name">${displayName}</span>
                <span class="leaderboard-tokens">${tokens}</span>
            </div>
        `;
    }).join('');
}

// Update leaderboard periodically
setInterval(() => {
    if (window.tierSystem && window.fireworks && window.fireworks.started) {
        updateLeaderboard();
    }
}, 5000); // Every 5 seconds

// Character counter for cannon message
function updateCannonCharCount() {
    const input = document.getElementById('cannonMessageText');
    const counter = document.getElementById('cannonCharCount');

    if (input && counter) {
        counter.textContent = input.value.length;
    }
}

// Add event listener for character counter
document.addEventListener('DOMContentLoaded', () => {
    const cannonInput = document.getElementById('cannonMessageText');
    if (cannonInput) {
        cannonInput.addEventListener('input', updateCannonCharCount);
    }
});

// ============================================
// CIRCULAR COOLDOWN UI AROUND MOUSE CURSOR
// ============================================

// Track actual mouse position (viewport coordinates)
let actualMouseX = window.innerWidth / 2;
let actualMouseY = window.innerHeight / 2;

// Update mouse position instantly
document.addEventListener('mousemove', (e) => {
    actualMouseX = e.clientX;
    actualMouseY = e.clientY;
});

// Initialize cooldown canvas
let cooldownCanvas = null;
let cooldownCtx = null;

function initCooldownCanvas() {
    cooldownCanvas = document.getElementById('cooldownCanvas');
    if (!cooldownCanvas) return;

    cooldownCanvas.width = window.innerWidth;
    cooldownCanvas.height = window.innerHeight;
    cooldownCtx = cooldownCanvas.getContext('2d');

    // Resize handler
    window.addEventListener('resize', () => {
        if (cooldownCanvas) {
            cooldownCanvas.width = window.innerWidth;
            cooldownCanvas.height = window.innerHeight;
        }
    });

    // Start animation loop for cooldown circles
    animateCooldownCircles();
}

function animateCooldownCircles() {
    if (!cooldownCanvas || !cooldownCtx) return;

    // Clear canvas
    cooldownCtx.clearRect(0, 0, cooldownCanvas.width, cooldownCanvas.height);

    if (!window.fireworks || !window.fireworks.started) {
        requestAnimationFrame(animateCooldownCircles);
        return;
    }

    const now = Date.now();

    // Get user's rank to calculate opacity (lower ranks = more transparent)
    const tierInfo = window.tierSystem?.getUserTier();
    const userRank = tierInfo?.rank || 50; // Default to middle rank if not available

    // Calculate opacity based on rank (1-100 scale)
    // Rank 1 (king) = 0.9 opacity (very visible)
    // Rank 50 (middle) = 0.5 opacity (medium)
    // Rank 100 (lowest) = 0.2 opacity (subtle)
    const rankOpacity = 0.9 - ((userRank - 1) / 99) * 0.7; // Linear scale from 0.9 to 0.2

    // Inner silver circle - Regular shot cooldown (everyone)
    if (!regularShotReady) {
        const remaining = Math.max(0, regularShotCooldownEndTime - now);
        const progress = 1 - (remaining / REGULAR_SHOT_COOLDOWN);

        const innerRadius = 30;
        const lineWidth = 4;

        cooldownCtx.save();
        cooldownCtx.globalAlpha = rankOpacity; // Use rank-based opacity

        // Background circle (dark)
        cooldownCtx.beginPath();
        cooldownCtx.arc(actualMouseX, actualMouseY, innerRadius, 0, Math.PI * 2);
        cooldownCtx.strokeStyle = `rgba(100, 100, 100, ${0.3 * rankOpacity})`; // Scale background too
        cooldownCtx.lineWidth = lineWidth;
        cooldownCtx.stroke();

        // Progress arc (silver/white glow)
        cooldownCtx.beginPath();
        cooldownCtx.arc(actualMouseX, actualMouseY, innerRadius, -Math.PI / 2, (-Math.PI / 2) + (progress * Math.PI * 2));
        cooldownCtx.strokeStyle = '#e0e0e0';
        cooldownCtx.lineWidth = lineWidth;
        cooldownCtx.shadowBlur = 10 * rankOpacity; // Scale glow with opacity
        cooldownCtx.shadowColor = '#ffffff';
        cooldownCtx.stroke();

        cooldownCtx.restore();
    }

    // Outer gold circle - Big shot cooldown (king only)
    const isKing = isKingOfTheHill();
    if (isKing && !bigShotReady) {
        const remaining = Math.max(0, bigShotCooldownEndTime - now);
        const progress = 1 - (remaining / 30000);

        const outerRadius = 50;
        const lineWidth = 5;

        cooldownCtx.save();
        cooldownCtx.globalAlpha = 0.9;

        // Background circle (dark gold)
        cooldownCtx.beginPath();
        cooldownCtx.arc(actualMouseX, actualMouseY, outerRadius, 0, Math.PI * 2);
        cooldownCtx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        cooldownCtx.lineWidth = lineWidth;
        cooldownCtx.stroke();

        // Progress arc (golden glow)
        cooldownCtx.beginPath();
        cooldownCtx.arc(actualMouseX, actualMouseY, outerRadius, -Math.PI / 2, (-Math.PI / 2) + (progress * Math.PI * 2));
        cooldownCtx.strokeStyle = '#FFD700';
        cooldownCtx.lineWidth = lineWidth;
        cooldownCtx.shadowBlur = 15;
        cooldownCtx.shadowColor = '#FFA500';
        cooldownCtx.stroke();

        cooldownCtx.restore();
    }

    requestAnimationFrame(animateCooldownCircles);
}

// Emoji visibility toggle
let showRankEmoji = true; // Default to showing emojis

function toggleRankEmoji() {
    const checkbox = document.getElementById('showRankEmoji');
    showRankEmoji = checkbox?.checked ?? true;
    localStorage.setItem('showRankEmoji', showRankEmoji);
    console.log('Rank emoji visibility:', showRankEmoji ? 'ON' : 'OFF');
}

// Load emoji preference on startup
function loadEmojiPreference() {
    const saved = localStorage.getItem('showRankEmoji');
    if (saved !== null) {
        showRankEmoji = saved === 'true';
        const checkbox = document.getElementById('showRankEmoji');
        if (checkbox) {
            checkbox.checked = showRankEmoji;
        }
    }
}

// Call on page load
setTimeout(loadEmojiPreference, 100);

// Make functions globally accessible
window.saveName = saveName;
window.updateLeaderboard = updateLeaderboard;
window.startCooldownTimer = startCooldownTimer;
window.updateCannonCharCount = updateCannonCharCount;
window.toggleRankEmoji = toggleRankEmoji;

// Initialize cannon tracking and cooldown canvas on load (after all functions are defined)
initCannonTracking();
initCooldownCanvas();
