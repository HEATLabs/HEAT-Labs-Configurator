const DiscordRPC = require('discord-rpc');

class DiscordRichPresence {
    constructor(clientId) {
        this.clientId = clientId;
        this.rpc = new DiscordRPC.Client({
            transport: 'ipc'
        });
        this.connected = false;
        this.startTimestamp = null;
        this.currentActivity = null;
    }

    async initialize() {
        try {
            await this.rpc.login({
                clientId: this.clientId
            });
            this.connected = true;
            this.startTimestamp = new Date();
            console.log('Discord RPC connected successfully');

            // Set initial presence
            this.updatePresence();

            // Update presence every 15 seconds to keep it fresh
            setInterval(() => {
                if (this.connected) {
                    this.updatePresence();
                }
            }, 15000);

            return true;
        } catch (error) {
            console.error('Failed to connect to Discord RPC:', error);
            this.connected = false;

            // Retry connection after 30 seconds
            setTimeout(() => {
                console.log('Retrying Discord RPC connection...');
                this.initialize();
            }, 30000);

            return false;
        }
    }

    updatePresence(customDetails = null, customState = null) {
        if (!this.connected) return;

        const presence = {
            details: customDetails || 'Using HEAT Labs Configurator',
            state: customState || 'Editing configurations',
            startTimestamp: this.startTimestamp,
            largeImageKey: 'heatlabs_logo',
            largeImageText: 'HEAT Labs Configurator',
            smallImageKey: 'editing_icon',
            smallImageText: 'World of Tanks: HEAT',
            instance: false,
            buttons: [{
                    label: 'Visit HEAT Labs',
                    url: 'https://heatlabs.net'
                },
                {
                    label: 'Join The Community',
                    url: 'https://discord.heatlabs.net'
                }
            ]
        };

        this.currentActivity = presence;
        this.rpc.setActivity(presence).catch(error => {
            console.error('Failed to set Discord presence:', error);
            this.connected = false;
        });
    }

    updateWithStatus(status) {
        const statusMessages = {
            idle: {
                details: 'Using HEAT Labs Configurator',
                state: 'Idle'
            },
            editing: {
                details: 'Editing configuration',
                state: 'Making changes'
            },
            loading: {
                details: 'Loading project',
                state: 'Opening file'
            },
            saving: {
                details: 'Saving project',
                state: 'Writing changes'
            }
        };

        const message = statusMessages[status] || statusMessages.idle;
        this.updatePresence(message.details, message.state);
    }

    disconnect() {
        if (this.connected) {
            this.rpc.clearActivity();
            this.rpc.destroy();
            this.connected = false;
            console.log('Discord RPC disconnected');
        }
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = DiscordRichPresence;