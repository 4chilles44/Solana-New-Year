// Supabase Real-time Synchronization for Fireworks
// This enables all users to see the same fireworks in real-time

// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://oscgumqpkbxsgqmcmyhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zY2d1bXFwa2J4c2dxbWNteWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NTI1NTQsImV4cCI6MjA4MjQyODU1NH0.DLKBf16XYc540ph-7XRA3aBVjmYEjDtOOygiBAxucgA';

class FireworkSync {
    constructor() {
        this.supabase = null;
        this.channel = null;
        this.isConnected = false;
        this.sessionId = this.generateSessionId();
        this.viewerCount = 0;

        // Check if credentials are configured
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn('⚠️ Supabase credentials not configured. Real-time sync disabled.');
            console.warn('See DEPLOYMENT.md for setup instructions.');
            return;
        }

        this.initialize();
    }

    // Generate unique session ID for this browser
    generateSessionId() {
        return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now();
    }

    // Initialize Supabase client and real-time channel
    async initialize() {
        try {
            // Create Supabase client
            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Create a channel for fireworks
            this.channel = this.supabase.channel('fireworks-room', {
                config: {
                    broadcast: { self: false }, // Don't receive our own broadcasts
                },
            });

            // Listen for firework launches from other users
            this.channel
                .on('broadcast', { event: 'launch' }, (payload) => {
                    this.handleRemoteFirework(payload.payload);
                })
                .on('presence', { event: 'sync' }, () => {
                    const state = this.channel.presenceState();
                    this.viewerCount = Object.keys(state).length;
                    this.updateViewerCount();
                    console.log('👥 Viewers online:', this.viewerCount);
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    console.log('User joined:', key);
                })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                    console.log('User left:', key);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                        console.log('✅ Connected to real-time fireworks sync');
                        this.showSyncStatus(true);

                        // Track this user's presence
                        await this.channel.track({
                            user: this.sessionId,
                            online_at: new Date().toISOString(),
                        });
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Failed to connect to real-time sync');
                        this.showSyncStatus(false);
                    }
                });

        } catch (err) {
            console.error('Error initializing Supabase:', err);
            this.showSyncStatus(false);
        }
    }

    // Broadcast a firework launch to all users
    async broadcastFirework(x, y, targetY, fireworkType, scale) {
        if (!this.isConnected || !this.channel) {
            console.warn('Cannot broadcast: not connected');
            return; // Silently fail if not connected
        }

        try {
            console.log('🚀 Broadcasting firework:', { x, y, targetY, fireworkType, scale });
            await this.channel.send({
                type: 'broadcast',
                event: 'launch',
                payload: {
                    sessionId: this.sessionId,
                    x: x,
                    y: y,
                    targetY: targetY,
                    fireworkType: fireworkType,
                    scale: scale,
                    timestamp: Date.now()
                }
            });
            console.log('✅ Broadcast sent successfully');
        } catch (err) {
            console.error('Error broadcasting firework:', err);
        }
    }

    // Handle firework from remote user
    handleRemoteFirework(data) {
        console.log('📡 Received remote firework:', data);

        // Ignore if it's from our own session (shouldn't happen with self: false, but double check)
        if (data.sessionId === this.sessionId) {
            console.log('Ignoring own firework');
            return;
        }

        // Check if fireworks display is initialized
        if (!window.fireworks || !window.fireworks.started) {
            console.warn('Fireworks not initialized yet');
            return;
        }

        console.log('🎆 Launching remote firework');
        // Launch the firework using the remote data
        // Use launchFireworkAt method which accepts exact coordinates
        window.fireworks.launchFireworkAt(
            data.x,
            data.y,
            data.targetY,
            data.fireworkType,
            data.scale
        );
    }

    // Update viewer count display
    updateViewerCount() {
        let counter = document.getElementById('viewerCounter');

        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'viewerCounter';
            counter.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                padding: 10px 18px;
                border-radius: 25px;
                font-size: 0.95rem;
                font-weight: 600;
                z-index: 1000;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #ffffff;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(counter);
        }

        counter.textContent = `👥 ${this.viewerCount} ${this.viewerCount === 1 ? 'viewer' : 'viewers'}`;
    }

    // Show sync status indicator
    showSyncStatus(connected) {
        // Create or update status indicator
        let indicator = document.getElementById('syncStatusIndicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'syncStatusIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
                z-index: 1000;
                transition: all 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
        }

        if (connected) {
            indicator.textContent = '🟢 Live Sync';
            indicator.style.background = 'rgba(0, 255, 100, 0.2)';
            indicator.style.border = '1px solid rgba(0, 255, 100, 0.5)';
            indicator.style.color = '#00ff64';

            // Fade out after 3 seconds
            setTimeout(() => {
                indicator.style.opacity = '0.3';
            }, 3000);
        } else {
            indicator.textContent = '🔴 Offline';
            indicator.style.background = 'rgba(255, 50, 80, 0.2)';
            indicator.style.border = '1px solid rgba(255, 50, 80, 0.5)';
            indicator.style.color = '#ff5080';
            indicator.style.opacity = '1';
        }
    }

    // Disconnect from real-time sync
    disconnect() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.isConnected = false;
            console.log('Disconnected from real-time sync');
        }
    }
}

// Initialize sync when page loads
window.fireworkSync = null;

window.addEventListener('load', () => {
    // Wait a bit for Supabase library to load
    setTimeout(() => {
        if (window.supabase) {
            window.fireworkSync = new FireworkSync();
        } else {
            console.warn('⚠️ Supabase library not loaded. Real-time sync disabled.');
            console.warn('Make sure to include Supabase JS library in your HTML.');
        }
    }, 500);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.fireworkSync) {
        window.fireworkSync.disconnect();
    }
});
