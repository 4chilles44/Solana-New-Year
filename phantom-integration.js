// Phantom Wallet Integration for Fireworks
// Dual-gated: Check both SOL and token balance

const SOL_PER_ROCKET = 0.1; // 0.1 SOL = 1 rocket
const TOKEN_MINT = '3bgzvzaQ841puqUba7JaZqUbA7inHEMMSe3neBeapump'; // HP Token
const TOKENS_PER_ROCKET = 1000; // 1000 HP tokens = 1 rocket

// RPC endpoint - QuickNode dedicated endpoint for reliable balance reads
const RPC_ENDPOINT = 'https://broken-billowing-snow.solana-mainnet.quiknode.pro/6792cf53f193c7d68dd52d33cb634b45cb83ca0d/';

class PhantomWalletIntegration {
    constructor() {
        this.provider = null;
        this.publicKey = null;
        this.tokenBalance = 0;
        this.availableRockets = 0;
        this.usedRockets = 0;
    }

    // Check if Phantom is installed
    isPhantomInstalled() {
        const isPhantomInstalled = window.phantom?.solana?.isPhantom;
        return isPhantomInstalled;
    }

    // Connect to Phantom wallet
    async connect() {
        if (!this.isPhantomInstalled()) {
            window.open('https://phantom.app/', '_blank');
            throw new Error('Phantom wallet is not installed');
        }

        try {
            const resp = await window.phantom.solana.connect();
            this.provider = window.phantom.solana;
            this.publicKey = resp.publicKey.toString();

            console.log('Connected to wallet:', this.publicKey);

            // Fetch token balance
            await this.updateTokenBalance();

            return {
                publicKey: this.publicKey,
                tokenBalance: this.tokenBalance,
                availableRockets: this.availableRockets
            };
        } catch (err) {
            console.error('Error connecting to Phantom:', err);
            throw err;
        }
    }

    // Disconnect wallet
    async disconnect() {
        if (this.provider) {
            await this.provider.disconnect();
            this.provider = null;
            this.publicKey = null;
            this.tokenBalance = 0;
            this.availableRockets = 0;
            this.usedRockets = 0;
        }
    }

    // Fetch both SOL and token balance from wallet
    async updateTokenBalance() {
        if (!this.publicKey) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log('Fetching balances for:', this.publicKey);

            // Create dedicated connection for balance reads (not using Phantom's connection)
            // Phantom is only used for signing transactions, not for RPC queries
            const connection = new window.solanaWeb3.Connection(RPC_ENDPOINT, 'confirmed');

            // Create PublicKey from wallet address
            const walletPublicKey = new window.solanaWeb3.PublicKey(this.publicKey);

            // Get SOL balance
            const lamports = await connection.getBalance(walletPublicKey);
            const solBalance = lamports / window.solanaWeb3.LAMPORTS_PER_SOL;
            console.log(`SOL Balance: ${solBalance} SOL`);

            // Get token balance
            let tokenBalance = 0;
            try {
                const tokenMintPublicKey = new window.solanaWeb3.PublicKey(TOKEN_MINT);

                // Get all token accounts for this wallet
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                    walletPublicKey,
                    { mint: tokenMintPublicKey }
                );

                console.log('Token accounts found:', tokenAccounts.value.length);

                if (tokenAccounts.value.length > 0) {
                    // Get the token amount from the first account
                    const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
                    tokenBalance = parseFloat(tokenAmount.uiAmount);
                    console.log(`HP Token Balance: ${tokenBalance} HP`);
                } else {
                    console.log('No HP token account found');
                }
            } catch (tokenErr) {
                console.error('Error fetching token balance:', tokenErr);
                console.log('Continuing with SOL balance only...');
            }

            // Store both balances
            this.tokenBalance = solBalance;
            this.hpTokenBalance = tokenBalance;

            // Calculate available rockets based on BOTH SOL and tokens
            const rocketsFromSol = Math.floor(solBalance / SOL_PER_ROCKET);
            const rocketsFromTokens = Math.floor(tokenBalance / TOKENS_PER_ROCKET);

            // Use the sum of both
            this.availableRockets = rocketsFromSol + rocketsFromTokens;

            console.log(`Rockets from SOL: ${rocketsFromSol}`);
            console.log(`Rockets from HP Tokens: ${rocketsFromTokens}`);
            console.log(`Total Available Rockets: ${this.availableRockets}`);

            return {
                tokenBalance: this.tokenBalance,
                hpTokenBalance: this.hpTokenBalance,
                availableRockets: this.availableRockets
            };

        } catch (err) {
            console.error('Error fetching balances:', err);
            console.error('Error details:', err.message);
            console.error('Error stack:', err.stack);

            // Set to 0 instead of throwing
            this.tokenBalance = 0;
            this.hpTokenBalance = 0;
            this.availableRockets = 0;

            showNotification('Could not fetch wallet balances', 'error');

            return {
                tokenBalance: 0,
                hpTokenBalance: 0,
                availableRockets: 0
            };
        }
    }

    // Check if user can launch a rocket
    canLaunchRocket() {
        const remaining = this.availableRockets - this.usedRockets;
        return remaining > 0;
    }

    // Use a rocket (called when user clicks)
    useRocket() {
        if (this.canLaunchRocket()) {
            this.usedRockets++;
            return {
                success: true,
                remaining: this.availableRockets - this.usedRockets
            };
        }
        return {
            success: false,
            remaining: 0
        };
    }

    // Reset used rockets count
    resetUsedRockets() {
        this.usedRockets = 0;
    }

    // Get current status
    getStatus() {
        return {
            connected: this.publicKey !== null,
            publicKey: this.publicKey,
            tokenBalance: this.tokenBalance,
            hpTokenBalance: this.hpTokenBalance || 0,
            availableRockets: this.availableRockets,
            usedRockets: this.usedRockets,
            remainingRockets: Math.max(0, this.availableRockets - this.usedRockets)
        };
    }

    // Start automatic balance polling for live updates
    startBalancePolling(intervalMs = 5000) { // Default 5 seconds
        if (this.balancePollingInterval) {
            clearInterval(this.balancePollingInterval);
        }

        this.balancePollingInterval = setInterval(async () => {
            if (this.publicKey) {
                try {
                    const oldBalance = this.tokenBalance;
                    const oldHpBalance = this.hpTokenBalance;
                    await this.updateTokenBalance();

                    // Check if balance changed
                    if (this.tokenBalance !== oldBalance || this.hpTokenBalance !== oldHpBalance) {
                        console.log('Balance updated:', {
                            old: { token: oldBalance, hp: oldHpBalance },
                            new: { token: this.tokenBalance, hp: this.hpTokenBalance }
                        });

                        // Update tier system with new balance
                        if (window.tierSystem) {
                            const oldRank = window.tierSystem.getUserTier()?.rank;
                            window.tierSystem.setUser(this.publicKey, this.tokenBalance);

                            const newRank = window.tierSystem.getUserTier()?.rank;

                            // Notify user of rank change
                            if (oldRank !== newRank && newRank) {
                                let rankMessage = `Your rank updated to #${newRank}!`;
                                if (newRank === 1) {
                                    rankMessage = '🎉 You are now the #1 holder! Cannon unlocked!';
                                } else if (oldRank === 1) {
                                    rankMessage = 'Your rank changed. Cannon control transferred.';
                                }
                                showNotification(rankMessage, newRank === 1 ? 'success' : 'info');
                            }
                        }

                        // Update UI
                        updateWalletUI(this.getStatus());
                    }
                } catch (error) {
                    console.error('Error during balance polling:', error);
                }
            }
        }, intervalMs);

        console.log(`Started balance polling every ${intervalMs}ms`);
    }

    // Stop balance polling
    stopBalancePolling() {
        if (this.balancePollingInterval) {
            clearInterval(this.balancePollingInterval);
            this.balancePollingInterval = null;
            console.log('Stopped balance polling');
        }
    }
}

// Global instance
const phantomWallet = new PhantomWalletIntegration();

// UI Update Functions
function updateWalletUI(status) {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const rocketsDisplay = document.getElementById('rocketsRemaining');

    if (status.connected) {
        connectBtn.textContent = 'Disconnect';
        connectBtn.classList.add('connected');
        walletInfo.classList.remove('hidden');

        rocketsDisplay.textContent = status.remainingRockets;
    } else {
        connectBtn.textContent = 'Connect Phantom';
        connectBtn.classList.remove('connected');
        walletInfo.classList.add('hidden');
    }
}

// Connect/Disconnect button handler
async function toggleWalletConnection() {
    const status = phantomWallet.getStatus();

    try {
        if (status.connected) {
            // Stop balance polling before disconnecting
            phantomWallet.stopBalancePolling();

            await phantomWallet.disconnect();
            updateWalletUI(phantomWallet.getStatus());

            // Re-enable random mode
            if (fireworks) {
                fireworks.randomMode = true;
            }
        } else {
            const result = await phantomWallet.connect();
            updateWalletUI(phantomWallet.getStatus());

            // Disable random mode when wallet is connected
            if (fireworks) {
                fireworks.randomMode = false;
            }

            // Start balance polling for live updates
            phantomWallet.startBalancePolling();

            // Show success message
            showNotification(`Connected! You have ${result.availableRockets} rockets available.`, 'success');
        }
    } catch (err) {
        console.error('Wallet error:', err);
        showNotification(err.message || 'Failed to connect wallet', 'error');
    }
}

// Refresh token balance
async function refreshTokenBalance() {
    const status = phantomWallet.getStatus();

    if (!status.connected) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }

    try {
        showNotification('Refreshing balance...', 'info');
        await phantomWallet.updateTokenBalance();
        updateWalletUI(phantomWallet.getStatus());
        showNotification('Balance updated!', 'success');
    } catch (err) {
        console.error('Error refreshing balance:', err);
        showNotification('Failed to refresh balance', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Initialize on page load
window.addEventListener('load', () => {
    // Check if Phantom is installed
    if (!phantomWallet.isPhantomInstalled()) {
        console.log('Phantom wallet not detected');
    }

    // Auto-connect if previously connected
    if (window.phantom?.solana?.isConnected) {
        phantomWallet.connect().then(() => {
            updateWalletUI(phantomWallet.getStatus());
        }).catch(err => {
            console.error('Auto-connect failed:', err);
        });
    }
});
