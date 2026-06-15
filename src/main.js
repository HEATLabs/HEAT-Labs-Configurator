const {
    app,
    BrowserWindow,
    dialog,
    ipcMain
} = require('electron');
const path = require('path');
const fs = require('fs').promises;
const DiscordRichPresence = require('./discord-rpc');

let mainWindow;
let discordRPC = null;

// Discord Application Client ID
const DISCORD_CLIENT_ID = '1425290323986354309';

// Development flag - set to true during development
const isDevelopment = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1280,
        minHeight: 720,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            devTools: isDevelopment
        },
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#141312',
        show: false,
        icon: path.join(__dirname, '../assets/icon.png')
    });

    mainWindow.loadFile('src/index.html');

    // Block dev tools in production
    if (!isDevelopment) {
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });

        mainWindow.webContents.on('before-input-event', (event, input) => {
            // Block F12, Ctrl+Shift+I, Ctrl+Shift+C
            if (input.key === 'F12' ||
                (input.control && input.shift && input.key.toLowerCase() === 'i') ||
                (input.control && input.shift && input.key.toLowerCase() === 'c')) {
                event.preventDefault();
            }
        });
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        // Disconnect Discord RPC when window closes
        if (discordRPC) {
            discordRPC.disconnect();
        }
    });
}

// Initialize Discord Rich Presence
function initializeDiscordRPC() {
    if (DISCORD_CLIENT_ID && DISCORD_CLIENT_ID !== 'CLIENT_ID_HERE') {
        discordRPC = new DiscordRichPresence(DISCORD_CLIENT_ID);
        discordRPC.initialize().then(success => {
            if (success) {
                console.log('Discord Rich Presence initialized successfully');
            }
        });
    } else {
        console.warn('Discord Client ID not configured.');
    }
}

// Handle window controls
ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

// Handle file dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
    const defaultOptions = {
        properties: ['openFile'],
        filters: [{
            name: 'World of Tanks: HEAT Config Files',
            extensions: ['project', 'json']
        },
            {
                name: 'All Files',
                extensions: ['*']
            }
        ]
    };

    const dialogOptions = options ? {
        ...defaultOptions,
        ...options
    } : defaultOptions;
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

    // Update Discord RPC when opening file
    if (!result.canceled && discordRPC && discordRPC.isConnected()) {
        discordRPC.updateWithStatus('loading');
    }

    return result;
});

// Handle file reading
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf8');

        // Basic validation
        if (!content.trim()) {
            return {
                success: false,
                error: 'File is empty'
            };
        }
        return {
            success: true,
            content
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// Save file - preserves all original content, only updates targeted sections
ipcMain.handle('save-file', async (event, filePath, originalContent, updatedSettings) => {
    try {
        let parsedContent;
        try {
            parsedContent = JSON.parse(originalContent);
        } catch (e) {
            return {
                success: false,
                error: 'Invalid JSON in original file'
            };
        }

        // Ensure settings object exists
        if (!parsedContent.settings) {
            parsedContent.settings = {};
        }

        // Update only the targeted settings sections
        for (const [sectionKey, sectionData] of Object.entries(updatedSettings)) {
            if (sectionData !== undefined && sectionData !== null) {
                parsedContent.settings[sectionKey] = sectionData;
            }
        }

        const newContent = JSON.stringify(parsedContent, null, 2);
        await fs.writeFile(filePath, newContent, 'utf8');

        if (discordRPC && discordRPC.isConnected()) {
            const fileName = path.basename(filePath);
            discordRPC.updatePresence(`Editing: ${fileName}`, 'Making changes');
        }

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// Save as new file
ipcMain.handle('save-as-file', async (event, filePath, originalContent, updatedSettings) => {
    try {
        let parsedContent;
        try {
            parsedContent = JSON.parse(originalContent);
        } catch (e) {
            return {
                success: false,
                error: 'Invalid JSON in original file'
            };
        }

        if (!parsedContent.settings) {
            parsedContent.settings = {};
        }

        for (const [sectionKey, sectionData] of Object.entries(updatedSettings)) {
            if (sectionData !== undefined && sectionData !== null) {
                parsedContent.settings[sectionKey] = sectionData;
            }
        }

        const newContent = JSON.stringify(parsedContent, null, 2);
        await fs.writeFile(filePath, newContent, 'utf8');
        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('show-save-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [{
            name: 'Project Files',
            extensions: ['project']
        }, {
            name: 'All Files',
            extensions: ['*']
        }]
    });
    return result;
});

ipcMain.handle('save-options', async (event, options) => {
    try {
        const appDataPath = app.getPath('appData');
        const configDir = path.join(appDataPath, 'HEATLabsConfigurator');
        const configPath = path.join(configDir, 'settings.json');
        await fs.mkdir(configDir, {
            recursive: true
        });
        await fs.writeFile(configPath, JSON.stringify(options, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving options:', error);
        throw error;
    }
});

ipcMain.handle('load-options', async () => {
    try {
        const appDataPath = app.getPath('appData');
        const configPath = path.join(appDataPath, 'HEATLabsConfigurator', 'settings.json');
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {
                gamePath: '',
                autoLoad: true
            };
        }
        console.error('Error loading options:', error);
        throw error;
    }
});

ipcMain.handle('save-local-settings', async (event, configPath, settings) => {
    try {
        const configDir = path.dirname(configPath);
        const configuratorDir = path.join(configDir, 'configurator');
        await fs.mkdir(configuratorDir, {
            recursive: true
        });
        const settingsPath = path.join(configuratorDir, 'settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving local settings:', error);
        throw error;
    }
});

ipcMain.handle('load-local-settings', async (event, configPath) => {
    try {
        const configDir = path.dirname(configPath);
        const settingsPath = path.join(configDir, 'configurator', 'settings.json');
        const data = await fs.readFile(settingsPath, 'utf8');
        return JSON.parse(data);
    } catch (readError) {
        if (readError.code === 'ENOENT') return null;
        console.error('Error reading settings file:', readError);
        throw readError;
    }
});

ipcMain.handle('check-config-exists', async (event, gamePath) => {
    try {
        const configPath = path.join(gamePath, 'coldwar.project');
        await fs.access(configPath, fs.constants.F_OK);
        return {
            exists: true,
            path: configPath
        };
    } catch (error) {
        return {
            exists: false
        };
    }
});

// Handle commandline.args reading
ipcMain.handle('read-commandline-args', async (event, argsPath) => {
    try {
        // Ensure bin directory exists
        const binDir = path.dirname(argsPath);
        await fs.mkdir(binDir, { recursive: true });

        let content = '';
        try {
            content = await fs.readFile(argsPath, 'utf8');
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                // File doesn't exist, create default
                content = '--project ../coldwar.project -m client --replay-record';
                await fs.writeFile(argsPath, content, 'utf8');
            } else {
                throw readError;
            }
        }

        return {
            success: true,
            content: content.trim()
        };
    } catch (error) {
        console.error('Error reading commandline.args:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Handle commandline.args saving
ipcMain.handle('save-commandline-args', async (event, binPath, argsContent) => {
    try {
        // Ensure bin directory exists
        await fs.mkdir(binPath, { recursive: true });

        const argsFilePath = path.join(binPath, 'commandline.args');
        await fs.writeFile(argsFilePath, argsContent, 'utf8');

        return {
            success: true
        };
    } catch (error) {
        console.error('Error saving commandline.args:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Handle path joining
ipcMain.handle('join-path', async (event, ...paths) => {
    return path.join(...paths);
});

ipcMain.handle('update-discord-status', async (event, status) => {
    if (discordRPC && discordRPC.isConnected()) {
        discordRPC.updateWithStatus(status);
    }
});

ipcMain.handle('update-discord-custom', async (event, details, state) => {
    if (discordRPC && discordRPC.isConnected()) {
        discordRPC.updatePresence(details, state);
    }
});

app.whenReady().then(() => {
    createWindow();
    setTimeout(() => {
        initializeDiscordRPC();
    }, 2000);
});

app.on('window-all-closed', () => {
    if (discordRPC) discordRPC.disconnect();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
    if (discordRPC) discordRPC.disconnect();
});