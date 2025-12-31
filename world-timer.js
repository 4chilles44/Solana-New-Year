// World New Year Timer
// Tracks and celebrates New Year across all timezones worldwide

class WorldNewYearTimer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Time mode: 'test' (accelerated) or 'live' (real-time)
        this.timeMode = 'live';
        this.baseAcceleration = 1000; // Fast forward speed: 1 second = 1000 seconds (16.6 minutes)
        this.currentAcceleration = 1000; // Current speed (changes dynamically)

        // Time tracking
        this.testModeStartTime = Date.now();
        this.testModeOffset = 0;

        // Target year for New Year celebrations
        this.targetYear = 2026;

        // Active celebrations (timezone -> { startTime, endTime, countries })
        this.activeCelebrations = new Map();

        // Completed celebrations
        this.completedCelebrations = new Set();

        // Fireworks, particles, and lanterns
        this.fireworks = [];
        this.particles = [];
        this.lanterns = [];
        this.stars = [];
        this.maxParticles = 500;

        // Initialize stars
        this.initializeStars();

        // Countdown display
        this.countdownDisplay = null;  // {timeLeft, countries, startTime}

        // Mouse tracking for lantern tooltips
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredLantern = null;

        // Animation
        this.lastTime = Date.now();
        this.animationId = null;

        // Setup
        this.setupCanvas();
        this.setupEventListeners();
        this.populateTimeline();
        this.start();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Reinitialize stars on resize
        if (this.stars.length > 0) {
            this.initializeStars();
        }
    }

    initializeStars() {
        // Create 200 stars scattered across the top 40% of canvas
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.4), // Top 40% only
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    drawStars() {
        // Only draw stars during celebrations
        if (this.activeCelebrations.size === 0) return;

        this.stars.forEach(star => {
            // Twinkling effect
            star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.02;
            star.opacity = Math.max(0.2, Math.min(0.8, star.opacity));

            this.ctx.save();
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw star twinkle rays
            if (star.opacity > 0.6) {
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 0.5;
                this.ctx.globalAlpha = (star.opacity - 0.6) * 2;

                // Horizontal ray
                this.ctx.beginPath();
                this.ctx.moveTo(star.x - star.size * 3, star.y);
                this.ctx.lineTo(star.x + star.size * 3, star.y);
                this.ctx.stroke();

                // Vertical ray
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y - star.size * 3);
                this.ctx.lineTo(star.x, star.y + star.size * 3);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    setupEventListeners() {
        // Time mode toggle
        document.getElementById('testModeBtn').addEventListener('click', () => {
            this.setTimeMode('test');
        });

        document.getElementById('liveModeBtn').addEventListener('click', () => {
            this.setTimeMode('live');
        });

        // Spacebar to launch lanterns
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.launchLantern();
            }
        });

        // Track mouse position for lantern tooltips
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    setTimeMode(mode) {
        this.timeMode = mode;

        if (mode === 'test') {
            this.testModeStartTime = Date.now();
            // Start from a time just before New Year in the earliest timezone
            const newYearUTC = Date.UTC(this.targetYear, 0, 1, 0, 0, 0);
            // Earliest timezone is UTC+14 (Kiribati)
            const earliestNewYear = newYearUTC - (14 * 60 * 60 * 1000);
            // Start 1 hour before earliest midnight in test mode
            this.testModeOffset = earliestNewYear - (60 * 60 * 1000);
        }

        // Update UI
        document.getElementById('testModeBtn').classList.toggle('active', mode === 'test');
        document.getElementById('liveModeBtn').classList.toggle('active', mode === 'live');

        // Reset celebrations
        this.activeCelebrations.clear();
        this.completedCelebrations.clear();
    }

    getCurrentTime() {
        if (this.timeMode === 'test') {
            const elapsed = Date.now() - this.testModeStartTime;
            const acceleratedElapsed = elapsed * this.currentAcceleration;
            return new Date(this.testModeOffset + acceleratedElapsed);
        } else {
            return new Date();
        }
    }

    updateTestModeSpeed() {
        if (this.timeMode !== 'test') return;

        const now = this.getCurrentTime();
        const nextCelebration = this.findNextCelebration(now);

        if (nextCelebration) {
            const timeUntil = nextCelebration.newYearTime - now.getTime();

            // Slow down to normal speed when within 10 seconds of a celebration
            if (timeUntil <= 10000 && timeUntil > 0) {
                // Normal speed
                if (this.currentAcceleration !== 1) {
                    // Adjust offset to maintain time continuity when switching speeds
                    const currentTime = this.getCurrentTime();
                    this.testModeOffset = currentTime.getTime();
                    this.testModeStartTime = Date.now();
                    this.currentAcceleration = 1;
                }
            } else {
                // Fast forward speed
                if (this.currentAcceleration !== this.baseAcceleration) {
                    // Check if we're in a celebration (should stay at normal speed)
                    const inCelebration = this.activeCelebrations.size > 0;

                    if (!inCelebration) {
                        // Adjust offset to maintain time continuity when switching speeds
                        const currentTime = this.getCurrentTime();
                        this.testModeOffset = currentTime.getTime();
                        this.testModeStartTime = Date.now();
                        this.currentAcceleration = this.baseAcceleration;
                    }
                }
            }
        }

        // Keep normal speed during active celebrations (full 2 minutes)
        if (this.activeCelebrations.size > 0 && this.currentAcceleration !== 1) {
            const currentTime = this.getCurrentTime();
            this.testModeOffset = currentTime.getTime();
            this.testModeStartTime = Date.now();
            this.currentAcceleration = 1;
        }
    }

    populateTimeline() {
        const track = document.getElementById('timelineTrack');
        track.innerHTML = '';

        ALL_TIMEZONES.forEach(offset => {
            const zone = WORLD_DATA[offset];
            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'timeline-zone';
            zoneDiv.dataset.offset = offset;

            // Label
            const label = document.createElement('div');
            label.className = 'timeline-zone-label';
            label.textContent = `UTC${offset >= 0 ? '+' : ''}${offset}`;
            zoneDiv.appendChild(label);

            // Flags
            const flagsDiv = document.createElement('div');
            flagsDiv.className = 'timeline-zone-flags';
            zone.countries.forEach(country => {
                const flag = document.createElement('span');
                flag.className = 'timeline-zone-flag';
                flag.textContent = country.emoji;
                flag.title = country.name;
                flagsDiv.appendChild(flag);
            });
            zoneDiv.appendChild(flagsDiv);

            // Time
            const time = document.createElement('div');
            time.className = 'timeline-zone-time';
            zoneDiv.appendChild(time);

            track.appendChild(zoneDiv);
        });
    }

    updateTimeline() {
        const now = this.getCurrentTime();

        ALL_TIMEZONES.forEach(offset => {
            const zoneDiv = document.querySelector(`[data-offset="${offset}"]`);
            if (!zoneDiv) return;

            const { newYearTime, isActive, isCompleted } = this.getTimezoneStatus(offset, now);

            // Update classes
            zoneDiv.classList.toggle('active', isActive);
            zoneDiv.classList.toggle('completed', isCompleted);

            // Update time display
            const timeDiv = zoneDiv.querySelector('.timeline-zone-time');
            const zoneDate = new Date(now.getTime() + (parseFloat(offset) * 60 * 60 * 1000));
            timeDiv.textContent = zoneDate.toTimeString().substring(0, 8);
        });
    }

    getTimezoneStatus(offset, now) {
        const offsetMs = parseFloat(offset) * 60 * 60 * 1000;
        const newYearUTC = Date.UTC(this.targetYear, 0, 1, 0, 0, 0);
        const newYearTime = newYearUTC - offsetMs;

        // In test mode: 2 minutes per celebration (to match live mode structure)
        // In live mode: 2 minutes per celebration (60s country themed + 30s gold + 30s country themed)
        const celebrationDuration = this.timeMode === 'test' ? 120000 : 120000;
        const celebrationEnd = newYearTime + celebrationDuration;

        const nowTime = now.getTime();
        const isActive = nowTime >= newYearTime && nowTime < celebrationEnd;
        const isCompleted = nowTime >= celebrationEnd;

        return { newYearTime, isActive, isCompleted };
    }

    checkCelebrations() {
        const now = this.getCurrentTime();

        ALL_TIMEZONES.forEach(offset => {
            const { newYearTime, isActive, isCompleted } = this.getTimezoneStatus(offset, now);

            if (isActive && !this.activeCelebrations.has(offset)) {
                // Start celebration
                this.startCelebration(offset, newYearTime);
            } else if (isCompleted && this.activeCelebrations.has(offset)) {
                // End celebration
                this.endCelebration(offset);
            }
        });
    }

    startCelebration(offset, startTime) {
        const countries = WORLD_DATA[offset].countries;

        // 2 minute celebration with 3 phases
        const celebrationDuration = 120000; // 2 minutes
        const endTime = startTime + celebrationDuration;

        this.activeCelebrations.set(offset, {
            startTime,
            endTime,
            countries,
            offset,
            finaleTriggered: false,
            goldPhaseTriggered: false,
            phase: 1 // Start with phase 1 (country themed)
        });

        console.log(`🎆 Celebration started: UTC${offset >= 0 ? '+' : ''}${offset}`, countries.map(c => c.name));

        // Launch initial fireworks burst
        this.launchCelebrationBurst(countries);
    }


    endCelebration(offset) {
        this.activeCelebrations.delete(offset);
        this.completedCelebrations.add(offset);
        console.log(`✅ Celebration ended: UTC${offset >= 0 ? '+' : ''}${offset}`);
    }

    launchCelebrationBurst(countries) {
        // Launch 5-10 fireworks for this celebration
        const count = 5 + Math.floor(Math.random() * 6);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const country = countries[Math.floor(Math.random() * countries.length)];
                this.launchFirework(country);
            }, i * 200);
        }
    }

    launchFirework(country) {
        const x = Math.random() * this.canvas.width;
        // Even higher explosions: 10-30% from top (was 20-40%)
        const targetY = this.canvas.height * (0.1 + Math.random() * 0.2);

        const firework = {
            x: x,
            y: this.canvas.height,
            targetY: targetY,
            vx: 0,
            vy: -(7 + Math.random() * 4), // Faster velocity for taller rockets (was 5-8)
            country: country,
            exploded: false,
            trail: []
        };

        this.fireworks.push(firework);
    }


    updateFireworks(deltaTime) {
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];

            if (!fw.exploded) {
                // Move firework up
                fw.vy += 0.05; // Gravity
                fw.x += fw.vx * deltaTime;
                fw.y += fw.vy * deltaTime;

                // Add trail
                fw.trail.push({ x: fw.x, y: fw.y });
                if (fw.trail.length > 20) fw.trail.shift();

                // Check if reached target or going down
                if (fw.y <= fw.targetY || fw.vy > 0) {
                    fw.exploded = true;
                    this.explode(fw);
                    this.fireworks.splice(i, 1);
                }
            }
        }
    }

    explode(firework) {
        // Bigger explosions for finale rockets
        const baseParticleCount = firework.isFinale ? 250 : 120;
        const particleCount = baseParticleCount + Math.floor(Math.random() * 60);
        const colors = firework.country.colors;

        // Always show text for finale, 50% chance for regular
        const showText = firework.isFinale || Math.random() < 0.5;

        if (showText && firework.country.greeting) {
            // Create text particle (only if country has a greeting)
            this.createTextParticle(firework.x, firework.y, firework.country);
        }

        // Create colored particles
        for (let i = 0; i < particleCount; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 3 + Math.random() * 4; // Bigger explosion radius (was 2-5)
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push({
                x: firework.x,
                y: firework.y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: color,
                alpha: 1,
                size: 3 + Math.random() * 3, // Bigger particles (was 2-4)
                decay: 0.015 + Math.random() * 0.01,
                gravity: 0.015 // 2x slower fall (was 0.03)
            });
        }
    }


    createTextParticle(x, y, country) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0, // No vertical movement - stays in place
            text: country.greeting,
            emoji: country.emoji,
            country: country.name,
            alpha: 1,
            size: 1,
            scale: 0.1,
            targetScale: 1.5, // Bigger text scale (was 1.2)
            decay: 0.0015, // Faster fade - shorter duration
            isText: true,
            growthComplete: false
        });
    }

    launchLantern() {
        // Check if lanterns should be disabled
        if (!this.canLaunchLantern()) {
            return; // Don't launch during countdown or celebration
        }

        // Launch a lantern from a random position at the bottom
        const x = this.canvas.width * (0.2 + Math.random() * 0.6);
        const y = this.canvas.height;

        // Pick a random country to attribute this lantern to
        const allCountries = [];
        ALL_TIMEZONES.forEach(offset => {
            WORLD_DATA[offset].countries.forEach(country => {
                allCountries.push(country);
            });
        });
        const fromCountry = allCountries[Math.floor(Math.random() * allCountries.length)];

        const lantern = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
            vy: -1.5, // Upward velocity
            size: 20 + Math.random() * 15, // Smaller: 20-35px instead of 30-50px
            alpha: 1,
            glow: 0,
            color: {
                // Warmer colors - lower Kelvin spectrum (more red/orange)
                r: 255,
                g: 140 + Math.floor(Math.random() * 60), // 140-200 (was 200-255)
                b: 40 + Math.floor(Math.random() * 60)   // 40-100 (was 100-155)
            },
            sway: Math.random() * Math.PI * 2, // For swaying animation
            swaySpeed: 0.02 + Math.random() * 0.02,
            country: fromCountry // Track which country sent this
        };

        this.lanterns.push(lantern);
    }

    canLaunchLantern() {
        // Don't launch if there's an active celebration
        if (this.activeCelebrations.size > 0) {
            return false;
        }

        // Check if we're within 30 seconds of the next celebration
        const now = this.getCurrentTime();
        const nextCelebration = this.findNextCelebration(now);

        if (nextCelebration) {
            const timeUntil = nextCelebration.newYearTime - now.getTime();
            // Disable 30 seconds before show
            if (timeUntil <= 30000) {
                return false;
            }
        }

        return true;
    }

    updateLanterns(deltaTime) {
        this.hoveredLantern = null; // Reset hover state

        for (let i = this.lanterns.length - 1; i >= 0; i--) {
            const lantern = this.lanterns[i];

            // Update sway
            lantern.sway += lantern.swaySpeed;
            lantern.vx = Math.sin(lantern.sway) * 0.3;

            // Move
            lantern.x += lantern.vx * deltaTime;
            lantern.y += lantern.vy * deltaTime;

            // Gentle upward acceleration
            lantern.vy *= 0.998;

            // Pulsing glow
            lantern.glow = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

            // Check if mouse is hovering over this lantern
            const distance = Math.sqrt(
                Math.pow(this.mouseX - lantern.x, 2) +
                Math.pow(this.mouseY - lantern.y, 2)
            );
            if (distance < lantern.size * 2) {
                this.hoveredLantern = lantern;
            }

            // Fade out quicker - start fading earlier and faster
            if (lantern.y < this.canvas.height * 0.4) { // Start fading at 40% height instead of 20%
                lantern.alpha -= 0.025; // Fade 2.5x faster (was 0.01)
            }

            // Remove if off screen or faded
            if (lantern.y < -100 || lantern.alpha <= 0) {
                this.lanterns.splice(i, 1);
            }
        }
    }

    drawLanterns() {
        this.lanterns.forEach(lantern => {
            this.ctx.save();
            this.ctx.globalAlpha = lantern.alpha;

            // Draw glow
            const gradient = this.ctx.createRadialGradient(
                lantern.x, lantern.y, 0,
                lantern.x, lantern.y, lantern.size * 2
            );
            gradient.addColorStop(0, `rgba(${lantern.color.r}, ${lantern.color.g}, ${lantern.color.b}, ${lantern.glow * 0.6})`);
            gradient.addColorStop(0.5, `rgba(${lantern.color.r}, ${lantern.color.g}, ${lantern.color.b}, ${lantern.glow * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                lantern.x - lantern.size * 2,
                lantern.y - lantern.size * 2,
                lantern.size * 4,
                lantern.size * 4
            );

            // Draw lantern body
            this.ctx.fillStyle = `rgba(${lantern.color.r}, ${lantern.color.g}, ${lantern.color.b}, 0.9)`;

            // Main body (rounded rectangle)
            const bodyWidth = lantern.size * 0.6;
            const bodyHeight = lantern.size;
            this.ctx.beginPath();
            this.ctx.roundRect(
                lantern.x - bodyWidth / 2,
                lantern.y - bodyHeight / 2,
                bodyWidth,
                bodyHeight,
                5
            );
            this.ctx.fill();

            // Top cap
            this.ctx.fillStyle = `rgba(${lantern.color.r - 50}, ${lantern.color.g - 50}, ${lantern.color.b - 50}, 0.9)`;
            this.ctx.fillRect(
                lantern.x - bodyWidth / 2 - 2,
                lantern.y - bodyHeight / 2 - 5,
                bodyWidth + 4,
                5
            );

            // Bottom cap
            this.ctx.fillRect(
                lantern.x - bodyWidth / 2 - 2,
                lantern.y + bodyHeight / 2,
                bodyWidth + 4,
                5
            );

            // Inner glow (bright center)
            const innerGradient = this.ctx.createRadialGradient(
                lantern.x, lantern.y, 0,
                lantern.x, lantern.y, bodyWidth / 2
            );
            innerGradient.addColorStop(0, `rgba(255, 255, 200, ${lantern.glow * 0.8})`);
            innerGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

            this.ctx.fillStyle = innerGradient;
            this.ctx.beginPath();
            this.ctx.roundRect(
                lantern.x - bodyWidth / 2 + 3,
                lantern.y - bodyHeight / 2 + 3,
                bodyWidth - 6,
                bodyHeight - 6,
                3
            );
            this.ctx.fill();

            this.ctx.restore();
        });

        // Draw tooltip for hovered lantern
        if (this.hoveredLantern) {
            const lantern = this.hoveredLantern;
            this.ctx.save();
            this.ctx.globalAlpha = 1;

            // Tooltip background
            const tooltipPadding = 12;
            const tooltipText = `${lantern.country.emoji} ${lantern.country.name}`;
            this.ctx.font = 'bold 16px Arial';
            const textWidth = this.ctx.measureText(tooltipText).width;
            const tooltipWidth = textWidth + tooltipPadding * 2;
            const tooltipHeight = 36;

            // Position tooltip above lantern
            const tooltipX = lantern.x - tooltipWidth / 2;
            const tooltipY = lantern.y - lantern.size - tooltipHeight - 15;

            // Draw tooltip background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.beginPath();
            this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
            this.ctx.fill();

            // Draw tooltip border
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw tooltip text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tooltipText, lantern.x, tooltipY + tooltipHeight / 2);

            this.ctx.restore();
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.isText) {
                // Text particle behavior - stays in place, no movement
                // Scale up
                if (p.scale < p.targetScale) {
                    p.scale += 0.03; // Faster growth
                    if (p.scale >= p.targetScale) {
                        p.growthComplete = true;
                    }
                } else {
                    // Only start fading after growth is complete
                    p.alpha -= p.decay;
                }
            } else {
                // Regular particle behavior
                p.vy += p.gravity;
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.alpha -= p.decay;
            }

            // Remove if faded
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawFireworks() {
        this.fireworks.forEach(fw => {
            // Draw trail
            this.ctx.globalAlpha = 0.6;
            fw.trail.forEach((pos, index) => {
                const alpha = (index / fw.trail.length) * 0.6;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = fw.country.colors[0];
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // Draw rocket
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = fw.country.colors[0];
            this.ctx.beginPath();
            this.ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            if (p.isText) {
                // Draw text
                this.ctx.globalAlpha = p.alpha;
                const fontSize = 30 * p.scale;
                this.ctx.font = `bold ${fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                // Draw emoji above text
                this.ctx.font = `${fontSize * 1.2}px Arial`;
                this.ctx.fillText(p.emoji, p.x, p.y - fontSize * 0.8);

                // Draw greeting text with gradient
                const gradient = this.ctx.createLinearGradient(
                    p.x - 100, p.y,
                    p.x + 100, p.y
                );
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.5, '#FFA500');
                gradient.addColorStop(1, '#FFD700');

                this.ctx.fillStyle = gradient;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.font = `bold ${fontSize}px Arial`;
                this.ctx.strokeText(p.text, p.x, p.y);
                this.ctx.fillText(p.text, p.x, p.y);

                // Draw country name below
                this.ctx.font = `${fontSize * 0.5}px Arial`;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fillText(p.country, p.x, p.y + fontSize * 0.7);
            } else {
                // Draw colored particle
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.globalAlpha = 1;
    }

    updateUI() {
        const now = this.getCurrentTime();

        // Update current time display
        const timeStr = now.toISOString().substring(11, 19);
        document.getElementById('currentTimeValue').textContent = timeStr;

        // Update speed indicator (test mode only)
        const speedIndicator = document.getElementById('speedIndicator');
        if (this.timeMode === 'test') {
            if (this.currentAcceleration === 1) {
                speedIndicator.textContent = '▶ Normal Speed';
                speedIndicator.className = 'speed-indicator normal';
            } else {
                speedIndicator.textContent = '⏩ Fast Forward (1000x)';
                speedIndicator.className = 'speed-indicator fast';
            }
        } else {
            speedIndicator.textContent = '';
        }

        // Update celebrating countries
        const celebratingDiv = document.getElementById('celebratingCountries');
        if (this.activeCelebrations.size > 0) {
            celebratingDiv.innerHTML = '';
            this.activeCelebrations.forEach((celebration, offset) => {
                celebration.countries.forEach(country => {
                    const item = document.createElement('div');
                    item.className = 'celebration-item';
                    item.innerHTML = `
                        <div class="celebration-emoji">${country.emoji}</div>
                        <div class="celebration-details">
                            <div class="celebration-name">${country.name}</div>
                            <div class="celebration-greeting">${country.greeting}</div>
                        </div>
                    `;
                    celebratingDiv.appendChild(item);
                });
            });
        } else {
            celebratingDiv.innerHTML = `
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 14px; font-style: italic;">
                    Waiting for midnight...
                </div>
            `;
        }

        // Find next celebration
        const nextCelebration = this.findNextCelebration(now);
        if (nextCelebration) {
            const timeUntil = nextCelebration.newYearTime - now.getTime();
            const hours = Math.floor(timeUntil / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);

            document.getElementById('countdown').textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            const nextCountriesDiv = document.getElementById('nextCountries');
            nextCountriesDiv.innerHTML = '';
            nextCelebration.countries.forEach(country => {
                const chip = document.createElement('div');
                chip.className = 'next-country-chip';
                chip.innerHTML = `
                    <span class="next-country-emoji">${country.emoji}</span>
                    <span>${country.name}</span>
                `;
                nextCountriesDiv.appendChild(chip);
            });
        } else {
            document.getElementById('countdown').textContent = 'All Done! 🎉';
            document.getElementById('nextCountries').innerHTML = '';
        }
    }

    findNextCelebration(now) {
        let nearest = null;
        let nearestTime = Infinity;

        ALL_TIMEZONES.forEach(offset => {
            const { newYearTime, isActive, isCompleted } = this.getTimezoneStatus(offset, now);

            if (!isActive && !isCompleted) {
                const timeUntil = newYearTime - now.getTime();
                if (timeUntil > 0 && timeUntil < nearestTime) {
                    nearestTime = timeUntil;
                    nearest = {
                        offset,
                        newYearTime,
                        countries: WORLD_DATA[offset].countries
                    };
                }
            }
        });

        return nearest;
    }

    updateCountdownDisplay() {
        const now = this.getCurrentTime();
        const nextCelebration = this.findNextCelebration(now);

        if (nextCelebration) {
            const timeUntil = nextCelebration.newYearTime - now.getTime();

            // Show countdown when within 10 seconds (in live mode) or 5 seconds (in test mode)
            const countdownThreshold = this.timeMode === 'test' ? 5000 : 10000;

            if (timeUntil <= countdownThreshold && timeUntil > 0) {
                const secondsLeft = Math.ceil(timeUntil / 1000);
                this.countdownDisplay = {
                    secondsLeft,
                    countries: nextCelebration.countries,
                    offset: nextCelebration.offset
                };
            } else {
                this.countdownDisplay = null;
            }
        } else {
            this.countdownDisplay = null;
        }
    }

    drawCountdownDisplay() {
        if (!this.countdownDisplay) return;

        const { secondsLeft, countries } = this.countdownDisplay;

        // Large countdown number in center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Pulsing effect - only for the number
        const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;

        this.ctx.save();

        // Draw countdown number (with pulse)
        const fontSize = 200 * pulse;
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Gradient number
        const gradient = this.ctx.createLinearGradient(centerX, centerY - fontSize/2, centerX, centerY + fontSize/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');

        this.ctx.fillStyle = gradient;
        this.ctx.fillText(secondsLeft.toString(), centerX, centerY);

        // Stroke
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(secondsLeft.toString(), centerX, centerY);

        // Draw countries below - STATIC position (no pulse effect)
        // Use base fontSize (200) for consistent positioning
        const baseFontSize = 200;
        const flagsY = centerY + baseFontSize/2 + 100; // Fixed Y position

        // More spacing to prevent overlap: 100px per country
        const spacingPerCountry = 100;

        // Check if we need two rows
        const maxPerRow = Math.floor(this.canvas.width * 0.9 / spacingPerCountry);

        if (countries.length > maxPerRow) {
            // Two rows layout
            const row1Count = Math.ceil(countries.length / 2);
            const row2Count = countries.length - row1Count;

            // First row
            const row1Width = row1Count * spacingPerCountry;
            const row1StartX = centerX - row1Width / 2;

            for (let i = 0; i < row1Count; i++) {
                const country = countries[i];
                const x = row1StartX + i * spacingPerCountry + spacingPerCountry / 2;

                // Flag emoji
                this.ctx.font = '40px Arial';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(country.emoji, x, flagsY);

                // Country name
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillText(country.name, x, flagsY + 50);
            }

            // Second row
            const row2Width = row2Count * spacingPerCountry;
            const row2StartX = centerX - row2Width / 2;
            const row2Y = flagsY + 90;

            for (let i = 0; i < row2Count; i++) {
                const country = countries[row1Count + i];
                const x = row2StartX + i * spacingPerCountry + spacingPerCountry / 2;

                // Flag emoji
                this.ctx.font = '40px Arial';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(country.emoji, x, row2Y);

                // Country name
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillText(country.name, x, row2Y + 50);
            }
        } else {
            // Single row layout
            const totalWidth = countries.length * spacingPerCountry;
            const startX = centerX - totalWidth / 2;

            countries.forEach((country, index) => {
                const x = startX + index * spacingPerCountry + spacingPerCountry / 2;

                // Flag emoji
                this.ctx.font = '40px Arial';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(country.emoji, x, flagsY);

                // Country name - positioned with more space below flag
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillText(country.name, x, flagsY + 50);
            });
        }

        this.ctx.restore();
    }

    updateUIVisibility() {
        const celebrating = this.activeCelebrations.size > 0 || this.countdownDisplay !== null;

        // Hide UI panels during celebrations and countdowns
        const worldTimerInfo = document.getElementById('worldTimerInfo');
        const timeline = document.getElementById('timeline');
        const celebratingBar = document.getElementById('celebratingBar');
        const currentTime = document.getElementById('currentTime');

        if (celebrating) {
            worldTimerInfo.classList.add('hidden-during-celebration');
            timeline.classList.add('hidden-during-celebration');
            currentTime.classList.add('hidden-during-celebration'); // Hide current time
        } else {
            worldTimerInfo.classList.remove('hidden-during-celebration');
            timeline.classList.remove('hidden-during-celebration');
            currentTime.classList.remove('hidden-during-celebration'); // Show current time
        }

        // Show celebrating bar only during active celebrations (not countdowns)
        if (this.activeCelebrations.size > 0) {
            this.updateCelebratingBar();
            celebratingBar.classList.add('visible');
        } else {
            celebratingBar.classList.remove('visible');
        }
    }

    updateCelebratingBar() {
        const bar = document.getElementById('celebratingBar');
        bar.innerHTML = '';

        // Collect all celebrating countries
        const allCountries = [];
        this.activeCelebrations.forEach(celebration => {
            celebration.countries.forEach(country => {
                allCountries.push(country);
            });
        });

        // Display flags with tooltips
        allCountries.forEach(country => {
            const flagDiv = document.createElement('div');
            flagDiv.className = 'celebrating-flag';
            flagDiv.textContent = country.emoji;

            const tooltip = document.createElement('div');
            tooltip.className = 'flag-tooltip';
            tooltip.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">${country.emoji}</div>
                <div style="margin-bottom: 6px;">${country.name}</div>
                <div class="greeting">${country.greeting}</div>
            `;

            flagDiv.appendChild(tooltip);
            bar.appendChild(flagDiv);
        });
    }

    autoLaunchFireworks() {
        // During active celebrations, automatically launch country-themed fireworks
        if (this.activeCelebrations.size > 0) {
            this.activeCelebrations.forEach((celebration, offset) => {
                const now = this.getCurrentTime().getTime();
                const elapsed = now - celebration.startTime;
                const timeRemaining = celebration.endTime - now;

                // Launch finale in last 10 seconds
                if (timeRemaining <= 10000 && timeRemaining > 0 && !celebration.finaleTriggered) {
                    celebration.finaleTriggered = true;
                    this.launchFinale(celebration.countries);
                    return;
                }

                // Reduced launch frequency for less chaos and to prevent overlap (was 0.03)
                const launchChance = 0.015;

                if (Math.random() < launchChance) {
                    // Launch country themed fireworks
                    const randomCountry = celebration.countries[Math.floor(Math.random() * celebration.countries.length)];
                    this.launchFirework(randomCountry);
                }
            });
        }
    }

    launchFinale(countries) {
        // Sort countries alphabetically
        const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

        // Wait 3 seconds for other fireworks to fade before starting finale
        const initialDelay = 3000;

        // Launch one big centered rocket per country in alphabetical order
        sortedCountries.forEach((country, index) => {
            setTimeout(() => {
                this.launchCenteredFinaleRocket(country);
            }, initialDelay + (index * 1200)); // Wait 3s, then stagger by 1200ms each
        });
    }

    launchCenteredFinaleRocket(country) {
        // Centered position
        const x = this.canvas.width / 2;
        // Go very high
        const targetY = this.canvas.height * 0.15;

        const firework = {
            x: x,
            y: this.canvas.height,
            targetY: targetY,
            vx: 0,
            vy: -(10 + Math.random() * 2), // Faster for dramatic effect
            country: country,
            exploded: false,
            trail: [],
            isFinale: true // Mark as finale rocket for bigger explosion
        };

        this.fireworks.push(firework);
    }


    render() {
        // Fully clear canvas to prevent shadow trails
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw everything
        this.drawStars(); // Draw stars first (background layer)
        this.drawLanterns();
        this.drawFireworks();
        this.drawParticles();
        this.drawCountdownDisplay();
    }

    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 16.67; // Normalize to 60fps
        this.lastTime = now;

        // Update test mode speed (variable acceleration)
        this.updateTestModeSpeed();

        // Check for new celebrations
        this.checkCelebrations();

        // Update countdown display
        this.updateCountdownDisplay();

        // Update entities
        this.updateLanterns(deltaTime);
        this.updateFireworks(deltaTime);
        this.updateParticles(deltaTime);

        // Auto-launch fireworks during celebrations
        this.autoLaunchFireworks();

        // Update UI
        this.updateUI();
        this.updateTimeline();
        this.updateUIVisibility();

        // Render
        this.render();

        // Continue loop
        this.animationId = requestAnimationFrame(() => this.update());
    }

    start() {
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1000);

        // Start animation loop
        this.update();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    window.worldTimer = new WorldNewYearTimer();
});
