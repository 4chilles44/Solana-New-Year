// Tier System - Position-based hierarchy with smooth scaling
// Manages wallet registry, ranking, and tier assignment

class TierSystem {
    constructor() {
        // Wallet registry: { address: { balance, lastUpdate, holderNumber } }
        this.wallets = new Map();

        // Current user's stats
        this.userAddress = null;
        this.userRank = null;
        this.userTier = null;
        this.totalConnected = 0;



        // Test mode for cycling through positions
        this.testMode = false;
        this.testRank = 1;
        this.testTotalUsers = 100;

        // Activity tracking for dynamic cooldowns
        this.recentActivity = []; // Array of timestamps
        this.activityWindow = 10000; // 10 second window
        this.lastFireTime = 0;
    }

    // Register or update a wallet
    registerWallet(address, balance) {
        const existing = this.wallets.get(address);

        this.wallets.set(address, {
            balance: balance,
            lastUpdate: Date.now(),
            holderNumber: existing?.holderNumber || null // Preserve early holder number
        });

        // Recalculate all ranks
        this.updateRanks();
    }

    // Update ranks for all wallets
    updateRanks() {
        // Sort wallets by balance (descending)
        const sorted = Array.from(this.wallets.entries())
            .sort((a, b) => b[1].balance - a[1].balance);

        // Assign ranks
        sorted.forEach(([address, data], index) => {
            data.rank = index + 1;
        });

        this.totalConnected = sorted.length;
    }

    // Set current user
    setUser(address, balance) {
        this.userAddress = address;
        this.registerWallet(address, balance);

        const userData = this.wallets.get(address);
        this.userRank = userData.rank;
        this.userTier = this.calculateTier(this.userRank, this.totalConnected, balance);
    }

    // Calculate tier based on rank position
    // Uses logarithmic scaling to make top positions more distinct
    calculateTier(rank, total, balance) {

        // Calculate percentile (0-100, where 0 is #1)
        const percentile = ((rank - 1) / Math.max(total - 1, 1)) * 100;

        // Hybrid scaling: logarithmic for top positions + linear percentile component
        // This makes EVERY percentile point matter while keeping top positions distinct

        // Logarithmic component (stronger at top)
        const logScale = 1.0 - (Math.log10(rank + 9) / 2);

        // Percentile component (smooth scaling across entire range)
        const percentileScale = 1.0 - (percentile / 100);

        // Combine: 70% log (for top distinction) + 30% percentile (for smooth scaling)
        const combinedScale = (logScale * 0.7) + (percentileScale * 0.3);

        // Don't clamp scale - let config values fully control sizing
        const scale = Math.max(0.0, Math.min(1.0, combinedScale));

        // Determine tier name and special features
        let name, features;

        if (rank === 1) {
            name = 'King of the Hill';
            features = {
                hasCannonModel: true,
                autoMegaShot: true,
                rightClickFireballs: true,
                goldenAura: true,
                crownBanner: true,
                particleMultiplier: 3.0,
                specialVisuals: ['golden-aura', 'crown-banner', 'screen-shake'],
                cooldown: 0 // Unlimited firing
            };
        } else if (rank <= 5) {
            name = 'Apex';
            features = {
                particleMultiplier: 2.0 + (0.2 * (6 - rank)), // 2.8 for #2, 2.0 for #5
                specialVisuals: ['whale-companions', 'glowing-text', 'priority-render'],
                textEffects: 'glowing-emoji',
                cooldown: 0 // Unlimited firing
            };
        } else if (percentile <= 10) {
            name = 'Inferno';
            features = {
                particleMultiplier: 1.8,
                specialVisuals: ['dolphin-orbs', 'animated-text', 'cluster-burst'],
                cooldown: 3000
            };
        } else if (percentile <= 20) {
            name = 'Blaze';
            features = {
                particleMultiplier: 1.4,
                specialVisuals: ['shooting-stars', 'multi-stage'],
                cooldown: 5000
            };
        } else if (percentile <= 50) {
            name = 'Flame';
            features = {
                particleMultiplier: 1.2,
                specialVisuals: ['trailing-sparks'],
                textEffects: 'bold',
                cooldown: 10000
            };
        } else {
            name = 'Spark';
            features = {
                particleMultiplier: 1.0,
                specialVisuals: [],
                textEffects: 'plain',
                cooldown: 0 // unlimited
            };
        }

        return {
            name,
            rank,
            total,
            percentile: percentile.toFixed(1),
            scale, // 0.3 to 1.0
            features,
            // Rocket properties - use config if available, pass rank
            rocketHeight: this.getRocketHeight(scale, rank),
            rocketSize: this.getRocketSize(scale, rank),
            textSize: this.getTextSize(scale, rank),
            particleCount: this.getParticleCount(scale, features.particleMultiplier)
        };
    }

    // Get rocket height multiplier (how high it flies)
    getRocketHeight(scale, rank = null) {
        // Minimum height for rank #100: 0.79 (79% down screen - flies lower)
        // Maximum height for rank #1: 0.05 (5% from top)
        const minHeight = 0.79;
        const maxHeight = 0.05;
        return maxHeight + (1 - scale) * (minHeight - maxHeight);
    }

    // Get rocket size/explosion scale
    getRocketSize(scale, rank = null) {
        // Minimum size for rank #100: 0.44 (10% bigger than before)
        // Maximum size for rank #1: 8.0
        const minSize = 0.44;
        const maxSize = 8.0;
        const calculatedSize = minSize + scale * (maxSize - minSize);
        return calculatedSize;
    }

    // Get text size multiplier
    getTextSize(scale, rank = null) {
        // Minimum text size for rank #100: 0.44 (10% bigger than before)
        // Maximum text size for rank #1: 5.0
        const minText = 0.44;
        const maxText = 5.0;
        return minText + scale * (maxText - minText);
    }

    // Get particle count
    // Scale: 0.3-1.0, Multiplier: 1.0-3.0
    getParticleCount(scale, multiplier) {
        const baseCount = 80;
        const maxCount = 300;
        const scaleBonus = baseCount + (scale * (maxCount - baseCount));
        return Math.floor(scaleBonus * multiplier);
    }

    // Track firing activity
    recordFire() {
        const now = Date.now();
        this.recentActivity.push(now);
        this.lastFireTime = now;

        // Clean old activity (older than window)
        this.recentActivity = this.recentActivity.filter(
            timestamp => now - timestamp < this.activityWindow
        );
    }

    // Get current activity level (fires per second)
    getActivityLevel() {
        const now = Date.now();

        // Clean old activity
        this.recentActivity = this.recentActivity.filter(
            timestamp => now - timestamp < this.activityWindow
        );

        // Calculate fires per second in the window
        return this.recentActivity.length / (this.activityWindow / 1000);
    }

    // Calculate dynamic cooldown based on activity
    // Returns cooldown in milliseconds
    getDynamicCooldown(baseCooldown) {
        const activityLevel = this.getActivityLevel();

        // Activity thresholds:
        // 0-2 fps: No increase (quiet)
        // 2-5 fps: 1.5x cooldown (moderate)
        // 5-10 fps: 2x cooldown (busy)
        // 10+ fps: 3x cooldown (chaos)

        let multiplier = 1.0;

        if (activityLevel > 10) {
            multiplier = 3.0;
        } else if (activityLevel > 5) {
            multiplier = 2.0;
        } else if (activityLevel > 2) {
            multiplier = 1.5;
        }

        return Math.floor(baseCooldown * multiplier);
    }

    // Check if user can fire (respects cooldown)
    canFire() {
        const tierInfo = this.getUserTier();

        // No tier info or unlimited firing
        if (!tierInfo || !tierInfo.features || tierInfo.features.cooldown === 0) {
            return true;
        }

        const baseCooldown = tierInfo.features.cooldown;
        const dynamicCooldown = this.getDynamicCooldown(baseCooldown);
        const timeSinceLastFire = Date.now() - this.lastFireTime;

        return timeSinceLastFire >= dynamicCooldown;
    }

    // Get current user's tier info
    getUserTier() {
        if (this.testMode) {
            return this.calculateTier(this.testRank, this.testTotalUsers, 100000); // Use a default balance for test mode
        }

        if (!this.userAddress) {
            return {
                name: 'Not Connected',
                rank: null,
                percentile: 0,
                scale: 0,
                description: 'Connect wallet to participate'
            };
        }

        return this.userTier;
    }

    // Test mode: Set simulated rank
    setTestRank(rank, totalUsers = 100) {
        this.testMode = true;
        this.testRank = Math.max(1, Math.min(rank, totalUsers));
        this.testTotalUsers = totalUsers;

        console.log(`Test mode: Simulating rank #${this.testRank} out of ${totalUsers}`);

        // Trigger UI update
        if (window.updateTierDisplay) {
            window.updateTierDisplay();
        }
    }

    // Cycle through test ranks
    cycleTestRank(direction = 1) {
        if (!this.testMode) {
            this.testMode = true;
        }

        this.testRank += direction;

        // Wrap around
        if (this.testRank < 1) this.testRank = this.testTotalUsers;
        if (this.testRank > this.testTotalUsers) this.testRank = 1;

        console.log(`Test rank: #${this.testRank}/${this.testTotalUsers}`);

        // Trigger UI update
        if (window.updateTierDisplay) {
            window.updateTierDisplay();
        }
    }

    // Disable test mode
    disableTestMode() {
        this.testMode = false;
        console.log('Test mode disabled');

        if (window.updateTierDisplay) {
            window.updateTierDisplay();
        }
    }

    // Get tier color for UI
    getTierColor(tierName) {
        const colors = {
            'King of the Hill': '#FFD700',
            'Apex': '#FF6B00',
            'Inferno': '#FF0055',
            'Blaze': '#FF8800',
            'Flame': '#FFA500',
            'Spark': '#FFDD00',
            'Locked': '#666666',
            'Not Connected': '#888888'
        };
        return colors[tierName] || '#FFFFFF';
    }
}

// Global tier system instance
window.tierSystem = new TierSystem();
