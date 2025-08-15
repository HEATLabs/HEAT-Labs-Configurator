const {
    app,
    BrowserWindow,
    dialog,
    ipcMain
} = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

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
    });
}

// Handle window controls
ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
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
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

// Handle file dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
    const defaultOptions = {
        properties: ['openFile'],
        filters: [{
                name: 'Project CW Config Files',
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

        // Check if it looks like a valid project file
        if (!content.includes('AimingProjectSettings') &&
            !content.includes('WindowProjectSettings')) {
            return {
                success: false,
                error: 'File does not appear to be a valid coldwar.project file'
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

// Handle file saving
ipcMain.handle('save-file', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf8');
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

// Handle save dialog
ipcMain.handle('show-save-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [{
                name: 'Project Files',
                extensions: ['project']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
        ]
    });
    return result;
});

// Save user options to config file
ipcMain.handle('save-options', async (event, options) => {
    try {
        const appDataPath = app.getPath('appData');
        const configDir = path.join(appDataPath, 'PCWConfigurator');
        const configPath = path.join(configDir, 'settings.json');

        // Create directory if it doesn't exist
        await fs.mkdir(configDir, {
            recursive: true
        });

        // Write the file
        await fs.writeFile(configPath, JSON.stringify(options, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving options:', error);
        throw error;
    }
});

// Load user options from config file
ipcMain.handle('load-options', async () => {
    try {
        const appDataPath = app.getPath('appData');
        const configPath = path.join(appDataPath, 'PCWConfigurator', 'settings.json');

        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return defaults
            return {
                gamePath: '',
                autoLoad: true
            };
        }
        console.error('Error loading options:', error);
        throw error;
    }
});

// Handle saving local settings to configurator folder
ipcMain.handle('save-local-settings', async (event, configPath, settings) => {
    try {
        const configDir = path.dirname(configPath);
        const configuratorDir = path.join(configDir, 'configurator');

        // Create directory if it doesn't exist
        try {
            await fs.mkdir(configuratorDir, {
                recursive: true
            });
        } catch (mkdirError) {
            console.error('Error creating configurator directory:', mkdirError);
            throw new Error('Could not create settings directory');
        }

        const settingsPath = path.join(configuratorDir, 'settings.json');

        // Write the settings file
        try {
            await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
            return true;
        } catch (writeError) {
            console.error('Error writing settings file:', writeError);
            throw new Error('Could not save settings file');
        }
    } catch (error) {
        console.error('Error saving local settings:', error);
        throw error;
    }
});

// Handle loading local settings from configurator folder
ipcMain.handle('load-local-settings', async (event, configPath) => {
    try {
        const configDir = path.dirname(configPath);
        const settingsPath = path.join(configDir, 'configurator', 'settings.json');

        try {
            const data = await fs.readFile(settingsPath, 'utf8');
            return JSON.parse(data);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            console.error('Error reading settings file:', readError);
            throw new Error('Could not read settings file');
        }
    } catch (error) {
        console.error('Error loading local settings:', error);
        throw error;
    }
});

// Check if config file exists in game directory
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});