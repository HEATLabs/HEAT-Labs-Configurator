const {
    ipcRenderer
} = require('electron');

// Application state
let configData = null;
let originalConfig = null;
let currentFilePath = null;
let hasAttemptedAutoLoad = false;

// Default values
const defaultValues = {
    options: {
        gamePath: '',
        autoLoad: true
    },
    aiming: {
        "aimAssistSensitivityMultiplierAt500M": 0.5,
        "aimAssistSensitivityMultiplierAtZeroM": 0.5,
        "aimAssistTargetLockOnTime": 0.0,
        "distanceUpdateSpeed": 30.0,
        "maxAimingAngleError": 25.0,
        "maxDistance": 2000.0,
        "minDistance": 35.0,
        "stopType": "StopByRotation",
        "useLocalAimPoint": true,
        "useLocalDispersion": true
    },
    followAim: {
        "followAimAccMagnetMin": 0.3,
        "followAimAccMagnetMult": 0.5,
        "followAimCentringTime": 1.0,
        "followAimDecMagnetMin": 0.4,
        "followAimDecMagnetMult": 0.55,
        "followAimMaxMagnetPower": 0.4,
        "followAimMaxTargetDistance": 500.0,
        "followAimMinMagnetDistanceFromCenterPower": 0.3,
        "followAimMinRadiusScalingDistance": 200.0,
        "followAimRotationPullFactor": 0.1,
        "followAimSelectorCenterCoef": 1.5,
        "followAimSelectorCenterMin": 0.5,
        "followAimSelectorDistanceCoef": 0.3,
        "followAimSensitivityFactor": 0.7,
        "followAimTankCentringSize": 40.0,
        "followInnerRadius": 3.5,
        "followRadius": 4.3
    },
    armorOutliner: {
        "Max Distance": 400.0,
        "Is Enabled": true
    },
    haptics: {
        "heavyRumbleDurationMS": 500,
        "heavyRumbleHighFrequency": 0.8,
        "heavyRumbleLowFrequency": 0.8,
        "lightRumbleDurationMS": 300,
        "lightRumbleHighFrequency": 0.3,
        "lightRumbleLowFrequency": 0.3,
        "mediumRumbleDurationMS": 400,
        "mediumRumbleHighFrequency": 0.5,
        "mediumRumbleLowFrequency": 0.5
    },
    window: {
        "minSize": {
            "height": 720,
            "width": 1280
        }
    },
    frameLimiter: {
        "client": {
            "frequency": 250.0,
            "carriedOverspent": 0.4
        },
        "inactive client": {
            "frequency": 30.0,
            "carriedOverspent": 0.4
        }
    },
    markers: {
        "ally": {
            "InDirectVisible": {
                "opacity": 1.0,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": true,
                "isDistanceEnabled": true
            },
            "Dead": {
                "opacity": 0.5,
                "isEnabled": true,
                "isNameEnabled": false,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "DeadHotKey": {
                "opacity": 0.7,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "DeadInAiming": {
                "opacity": 0.3,
                "isEnabled": false,
                "isNameEnabled": false,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "InDirectInvisible": {
                "opacity": 0.8,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": true,
                "isDistanceEnabled": true
            }
        },
        "enemy": {
            "InDirectVisible": {
                "opacity": 1.0,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": true,
                "isDistanceEnabled": true
            },
            "Dead": {
                "opacity": 0.5,
                "isEnabled": true,
                "isNameEnabled": false,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "DeadHotKey": {
                "opacity": 0.7,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "DeadInAiming": {
                "opacity": 0.3,
                "isEnabled": false,
                "isNameEnabled": false,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "InDirectInvisible": {
                "opacity": 0.8,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": true,
                "isDistanceEnabled": true
            }
        },
        "platoon": {
            "InDirectVisible": {
                "opacity": 1.0,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": true,
                "isDistanceEnabled": true
            },
            "Dead": {
                "opacity": 0.5,
                "isEnabled": true,
                "isNameEnabled": false,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "DeadHotKey": {
                "opacity": 0.7,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "DeadInAiming": {
                "opacity": 0.3,
                "isEnabled": false,
                "isNameEnabled": false,
                "isHealthBarEnabled": false,
                "isDistanceEnabled": false
            },
            "InDirectInvisible": {
                "opacity": 0.8,
                "isEnabled": true,
                "isNameEnabled": true,
                "isHealthBarEnabled": true,
                "isDistanceEnabled": true
            }
        }
    }
};

// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const mainApp = document.getElementById('main-app');
const fileSection = document.getElementById('file-section');
const configContent = document.getElementById('config-content');
const browseFileBtn = document.getElementById('browseFile');
const changeFileBtn = document.getElementById('changeFile');
const fileNameEl = document.getElementById('fileName');
const filePathEl = document.getElementById('filePath');
const saveConfigBtn = document.getElementById('saveConfig');
const downloadConfigBtn = document.getElementById('downloadConfig');
const resetAllBtn = document.getElementById('resetAll');

// Options
const gamePathInput = document.getElementById('gamePathInput');
const browseGamePathBtn = document.getElementById('browseGamePath');
const clearGamePathBtn = document.getElementById('clearGamePath');
const autoLoadCheckbox = document.getElementById('autoLoadCheckbox');

// Window control buttons
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const closeBtn = document.getElementById('closeBtn');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Marker elements
const markerTypeSelect = document.getElementById('markerTypeSelect');
const markerStateSelect = document.getElementById('markerStateSelect');
const markerSettingsContent = document.getElementById('marker-settings-content');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadOptions();
});

async function initializeApp() {
    // Set up window control listeners
    minimizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-minimize');
    });

    maximizeBtn.addEventListener('click', async () => {
        await ipcRenderer.invoke('window-maximize');
        updateMaximizeButton();
    });

    closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-close');
    });

    // Set up event listeners
    browseFileBtn.addEventListener('click', loadConfigFile);
    saveConfigBtn.addEventListener('click', saveConfig);
    downloadConfigBtn.addEventListener('click', downloadConfig);
    resetAllBtn.addEventListener('click', resetAllSettings);
    browseGamePathBtn.addEventListener('click', browseGamePath);
    clearGamePathBtn.addEventListener('click', clearGamePath);
    autoLoadCheckbox.addEventListener('change', saveOptions);

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Marker dropdowns
    if (markerTypeSelect) {
        markerTypeSelect.addEventListener('change', updateMarkerSettings);
    }
    if (markerStateSelect) {
        markerStateSelect.addEventListener('change', updateMarkerSettings);
    }

    // Initialize maximize button state
    updateMaximizeButton();

    // Load options and check for config file
    await loadOptions();

    // Load local settings if we already have a config file
    if (currentFilePath) {
        await loadLocalSettings();
    }
}

async function updateMaximizeButton() {
    const isMaximized = await ipcRenderer.invoke('window-is-maximized');
    const maximizeIcon = maximizeBtn.querySelector('svg');

    if (isMaximized) {
        maximizeIcon.innerHTML = '<path d="M3 3h6v6H3zM7 7h6v6H7z" fill="none" stroke="currentColor" />';
    } else {
        maximizeIcon.innerHTML = '<path d="M1 1h10v10H1z" fill="none" stroke="currentColor" />';
    }
}

function switchTab(tabId) {
    // Update tab buttons
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab content
    tabContents.forEach(content => content.classList.remove('active'));
    const targetTab = document.getElementById(`${tabId}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

async function loadConfigFile() {
    try {
        hasAttemptedAutoLoad = true;
        const result = await ipcRenderer.invoke('show-open-dialog');

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const fileResult = await ipcRenderer.invoke('read-file', filePath);

            if (fileResult.success) {
                let parsedData;
                try {
                    // First try parsing as-is
                    parsedData = JSON.parse(fileResult.content);
                } catch (initialError) {
                    console.log('Initial parse failed, trying to clean JSON:', initialError);

                    // Try to clean the JSON content
                    const cleanedContent = cleanJsonContent(fileResult.content);
                    parsedData = JSON.parse(cleanedContent);
                }

                // Handle different file formats
                if (typeof parsedData === 'object' && parsedData !== null) {
                    // New format with "settings" wrapper
                    if (parsedData.settings) {
                        configData = parsedData.settings;
                    }
                    // Old format with direct settings
                    else {
                        configData = parsedData;
                    }

                    originalConfig = JSON.parse(JSON.stringify(configData));
                    currentFilePath = filePath;

                    // Save settings to configurator folder
                    try {
                        const settings = {
                            configPath: filePath,
                            gamePath: gamePathInput.value || '',
                            autoLoad: autoLoadCheckbox.checked
                        };
                        await ipcRenderer.invoke('save-local-settings', filePath, settings);
                    } catch (saveError) {
                        console.error('Error saving local settings:', saveError);
                        showToast('Loaded config but failed to save settings', 'warning');
                    }

                    // Update UI
                    const fileName = filePath.split(/[\\/]/).pop();
                    if (fileNameEl) fileNameEl.textContent = fileName;
                    if (filePathEl) filePathEl.textContent = filePath;

                    // Enable all tabs
                    tabBtns.forEach(btn => {
                        if (btn.dataset.tab !== 'home') {
                            btn.classList.remove('disabled');
                            btn.disabled = false;
                        }
                    });

                    // Show action bar
                    const actionBar = document.getElementById('actionBar');
                    if (actionBar) actionBar.style.display = 'flex';

                    // Switch to first settings tab
                    switchTab('aiming');

                    // Render all settings
                    renderAllSettings();

                    showToast('Configuration file loaded successfully!');
                } else {
                    showToast('Invalid file format: File is not a valid JSON object', 'error');
                }
            } else {
                showToast('Error reading file: ' + fileResult.error, 'error');
            }
        }
    } catch (error) {
        console.error('File loading error:', error);
        showToast('Error loading file: ' + error.message, 'error');
    }
}

function cleanJsonContent(content) {
    // Fix common JSON issues
    return content
        // Remove BOM if present
        .replace(/^\uFEFF/, '')
        // Fix unquoted keys
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
        // Fix single quotes
        .replace(/'/g, '"')
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, '$1')
        // Fix comments (simple removal)
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
}

// Helper function to check file content
function isValidColdWarProject(content) {
    try {
        const parsed = JSON.parse(content);
        return typeof parsed === 'object' && parsed !== null && (
            parsed.settings !== undefined ||
            parsed['cw::AimingProjectSettings'] !== undefined ||
            parsed['engine::WindowProjectSettings'] !== undefined
        );
    } catch (e) {
        return false;
    }
}

async function browseGamePath() {
    try {
        const result = await ipcRenderer.invoke('show-open-dialog', {
            properties: ['openDirectory'],
            title: 'Select your World of Tanks: HEAT Installation Folder'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const path = result.filePaths[0];
            gamePathInput.value = path;
            await saveOptions();

            // Check if config exists in this path
            const configResult = await ipcRenderer.invoke('check-config-exists', path);
            if (configResult.exists) {
                await loadConfigFromPath(configResult.path);
            }
        }
    } catch (error) {
        showToast('Error selecting game path: ' + error.message, 'error');
    }
}

function clearGamePath() {
    gamePathInput.value = '';
    saveOptions();
}

async function saveOptions() {
    const options = {
        gamePath: gamePathInput.value,
        autoLoad: autoLoadCheckbox.checked
    };

    try {
        // Save to app data
        await ipcRenderer.invoke('save-options', options);

        // Also save to local settings if we have a config file path
        if (currentFilePath) {
            const settings = {
                configPath: currentFilePath,
                gamePath: gamePathInput.value || '',
                autoLoad: autoLoadCheckbox.checked
            };
            await ipcRenderer.invoke('save-local-settings', currentFilePath, settings);
        }

        showToast('Options saved successfully');
    } catch (error) {
        showToast('Error saving options: ' + error.message, 'error');
    }
}

async function loadLocalSettings() {
    if (currentFilePath) {
        try {
            const settings = await ipcRenderer.invoke('load-local-settings', currentFilePath);

            if (settings) {
                gamePathInput.value = settings.gamePath || '';
                autoLoadCheckbox.checked = settings.autoLoad !== false;
            }
        } catch (error) {
            console.log('No local settings found:', error);
        }
    }
}

async function loadOptions() {
    try {
        const options = await ipcRenderer.invoke('load-options');
        if (options) {
            gamePathInput.value = options.gamePath || '';
            autoLoadCheckbox.checked = options.autoLoad !== false; // default to true

            // If auto-load is enabled and path exists, check for config file
            if (!hasAttemptedAutoLoad && options.autoLoad !== false && options.gamePath) {
                hasAttemptedAutoLoad = true;
                // Wait for splash screen to finish (3.0s)
                setTimeout(async () => {
                    try {
                        const result = await ipcRenderer.invoke('check-config-exists', options.gamePath);
                        if (result.exists) {
                            await loadConfigFromPath(result.path);
                        }
                    } catch (error) {
                        console.error('Error checking for config file:', error);
                    }
                }, 3000);
            }
        }
    } catch (error) {
        console.error('Error loading options:', error);
    }
}

async function loadConfigFromPath(filePath) {
    try {
        const fileResult = await ipcRenderer.invoke('read-file', filePath);

        if (fileResult.success) {
            try {
                // Try to parse as JSON first
                let parsedData = JSON.parse(fileResult.content);

                // Handle different file formats
                if (typeof parsedData === 'object' && parsedData !== null) {
                    // New format with "settings" wrapper
                    if (parsedData.settings) {
                        configData = parsedData.settings;
                    }
                    // Old format with direct settings
                    else {
                        configData = parsedData;
                    }

                    originalConfig = JSON.parse(JSON.stringify(configData)); // Deep copy
                    currentFilePath = filePath;

                    // Enable all tabs
                    tabBtns.forEach(btn => {
                        if (btn.dataset.tab !== 'home') {
                            btn.classList.remove('disabled');
                            btn.disabled = false;
                        }
                    });

                    // Show action bar
                    const actionBar = document.getElementById('actionBar');
                    if (actionBar) actionBar.style.display = 'flex';

                    // Switch to first settings tab
                    switchTab('aiming');

                    // Render all settings
                    renderAllSettings();

                    showToast('Configuration file loaded automatically from game directory');
                } else {
                    showToast('Invalid file format: File is not a valid JSON object', 'error');
                }
            } catch (parseError) {
                // Try to handle non-JSON files or malformed JSON
                try {
                    // Check if it's a minified JSON file without proper formatting
                    const fixedContent = fileResult.content
                        .replace(/([{\[,])\s*([^"\s]+)\s*:/g, '$1"$2":') // Fix unquoted keys
                        .replace(/'/g, '"'); // Replace single quotes with double quotes

                    const parsedData = JSON.parse(fixedContent);

                    if (parsedData.settings) {
                        configData = parsedData.settings;
                    } else {
                        configData = parsedData;
                    }

                    originalConfig = JSON.parse(JSON.stringify(configData));
                    currentFilePath = filePath;

                    // Enable all tabs
                    tabBtns.forEach(btn => {
                        if (btn.dataset.tab !== 'home') {
                            btn.classList.remove('disabled');
                            btn.disabled = false;
                        }
                    });

                    // Show action bar
                    const actionBar = document.getElementById('actionBar');
                    if (actionBar) actionBar.style.display = 'flex';

                    // Switch to first settings tab
                    switchTab('aiming');

                    // Render all settings
                    renderAllSettings();

                    showToast('Configuration file loaded successfully! (Auto-corrected format)');
                } catch (finalError) {
                    console.error('Final parsing error:', finalError);
                    showToast(`Error parsing file: ${finalError.message}`, 'error');
                }
            }
        } else {
            showToast('Error reading file: ' + fileResult.error, 'error');
        }
    } catch (error) {
        console.error('File loading error:', error);
        showToast('Error loading file: ' + error.message, 'error');
    }
}

async function checkForConfigFile(gamePath) {
    try {
        const configPath = path.join(gamePath, 'coldwar.project');
        const result = await ipcRenderer.invoke('read-file', configPath);

        if (result.success) {
            // Same logic as when loading a file manually
            let parsedData = JSON.parse(result.content);
            configData = parsedData.settings || parsedData;
            originalConfig = JSON.parse(JSON.stringify(configData));
            currentFilePath = configPath;

            // Update UI
            fileNameEl.textContent = 'coldwar.project';
            filePathEl.textContent = configPath;

            // Enable all tabs
            tabBtns.forEach(btn => {
                if (btn.dataset.tab !== 'home') {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            });

            // Show action bar
            actionBar.style.display = 'flex';

            // Switch to first settings tab
            switchTab('aiming');

            // Render all settings
            renderAllSettings();

            showToast('Configuration file loaded automatically from game directory');
        }
    } catch (error) {
        console.log('No config file found in game directory:', error);
    }
}

function renderOptionsSettings() {
    if (configData && configData.options) {
        gamePathInput.value = configData.options.gamePath || '';
        autoLoadCheckbox.checked = configData.options.autoLoad !== false;
    }
}

function renderAllSettings() {
    renderAimingSettings();
    renderFollowAimSettings();
    renderArmorOutlinerSettings();
    renderHapticsSettings();
    renderWindowSettings();
    renderPerformanceSettings();
    updateMarkerSettings();
    renderOptionsSettings();
}

function renderAimingSettings() {
    const tab = document.getElementById('aiming-tab');
    const aimingSettings = configData['cw::AimingProjectSettings'] || {};

    tab.innerHTML = '';

    const group = createSettingsGroup('General Aiming');
    tab.appendChild(group);

    createRangeInput(group, 'Aim Assist Sensitivity at 500m', 'aimAssistSensitivityMultiplierAt500M', aimingSettings, 0, 1, 0.01);
    createRangeInput(group, 'Aim Assist Sensitivity at 0m', 'aimAssistSensitivityMultiplierAtZeroM', aimingSettings, 0, 1, 0.01);
    createRangeInput(group, 'Target Lock On Time', 'aimAssistTargetLockOnTime', aimingSettings, 0, 5, 0.1);
    createRangeInput(group, 'Distance Update Speed', 'distanceUpdateSpeed', aimingSettings, 1, 100, 1);
    createRangeInput(group, 'Max Aiming Angle Error', 'maxAimingAngleError', aimingSettings, 1, 90, 1);
    createRangeInput(group, 'Max Distance', 'maxDistance', aimingSettings, 100, 5000, 10);
    createRangeInput(group, 'Min Distance', 'minDistance', aimingSettings, 1, 100, 1);

    const stopTypeOptions = ['StopByRotation', 'StopByDistance', 'StopByTime'];
    createDropdown(group, 'Stop Type', 'stopType', aimingSettings, stopTypeOptions);

    createCheckbox(group, 'Use Local Aim Point', 'useLocalAimPoint', aimingSettings);
    createCheckbox(group, 'Use Local Dispersion', 'useLocalDispersion', aimingSettings);
}

function renderFollowAimSettings() {
    const tab = document.getElementById('aim-assist-tab');
    const followAimSettings = configData['cw::FollowAimSettings'] || {};

    tab.innerHTML = '';

    const group = createSettingsGroup('Follow Aim Configuration');
    tab.appendChild(group);

    createRangeInput(group, 'Acceleration Magnet Min', 'followAimAccMagnetMin', followAimSettings, 0, 1, 0.01);
    createRangeInput(group, 'Acceleration Magnet Mult', 'followAimAccMagnetMult', followAimSettings, 0, 1, 0.01);
    createRangeInput(group, 'Centring Time', 'followAimCentringTime', followAimSettings, 0, 5, 0.1);
    createRangeInput(group, 'Deceleration Magnet Min', 'followAimDecMagnetMin', followAimSettings, 0, 1, 0.01);
    createRangeInput(group, 'Deceleration Magnet Mult', 'followAimDecMagnetMult', followAimSettings, 0, 1, 0.01);
    createRangeInput(group, 'Max Magnet Power', 'followAimMaxMagnetPower', followAimSettings, 0, 1, 0.01);
    createRangeInput(group, 'Max Target Distance', 'followAimMaxTargetDistance', followAimSettings, 100, 1000, 10);
    createRangeInput(group, 'Sensitivity Factor', 'followAimSensitivityFactor', followAimSettings, 0, 1, 0.01);
    createRangeInput(group, 'Follow Inner Radius', 'followInnerRadius', followAimSettings, 1, 10, 0.1);
    createRangeInput(group, 'Follow Radius', 'followRadius', followAimSettings, 1, 10, 0.1);
}

function renderArmorOutlinerSettings() {
    const tab = document.getElementById('armor-tab');
    const armorSettings = configData['cw::ArmorOutlinerProjectSettings'] || {};

    tab.innerHTML = '';

    const group = createSettingsGroup('Armor Detection');
    tab.appendChild(group);

    createRangeInput(group, 'Max Distance', 'Max Distance', armorSettings, 100, 1000, 10);
    createCheckbox(group, 'Enable Armor Outliner', 'Is Enabled', armorSettings);
}

function renderHapticsSettings() {
    const tab = document.getElementById('controller-tab');
    const hapticsSettings = configData['cw::HapticsProjectSettings'] || {};

    tab.innerHTML = '';

    // Heavy Rumble
    const heavyGroup = createSettingsGroup('Heavy Rumble');
    tab.appendChild(heavyGroup);
    createRangeInput(heavyGroup, 'Duration (ms)', 'heavyRumbleDurationMS', hapticsSettings, 100, 1000, 10);
    createRangeInput(heavyGroup, 'High Frequency', 'heavyRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
    createRangeInput(heavyGroup, 'Low Frequency', 'heavyRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);

    // Medium Rumble
    const mediumGroup = createSettingsGroup('Medium Rumble');
    tab.appendChild(mediumGroup);
    createRangeInput(mediumGroup, 'Duration (ms)', 'mediumRumbleDurationMS', hapticsSettings, 100, 1000, 10);
    createRangeInput(mediumGroup, 'High Frequency', 'mediumRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
    createRangeInput(mediumGroup, 'Low Frequency', 'mediumRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);

    // Light Rumble
    const lightGroup = createSettingsGroup('Light Rumble');
    tab.appendChild(lightGroup);
    createRangeInput(lightGroup, 'Duration (ms)', 'lightRumbleDurationMS', hapticsSettings, 100, 1000, 10);
    createRangeInput(lightGroup, 'High Frequency', 'lightRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
    createRangeInput(lightGroup, 'Low Frequency', 'lightRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);
}

function renderWindowSettings() {
    const tab = document.getElementById('window-tab');
    const windowSettings = configData['engine::WindowProjectSettings'] || {};

    tab.innerHTML = '';

    if (windowSettings.minSize) {
        const group = createSettingsGroup('Minimum Window Size');
        tab.appendChild(group);
        createRangeInput(group, 'Min Width', 'width', windowSettings.minSize, 800, 3840, 10);
        createRangeInput(group, 'Min Height', 'height', windowSettings.minSize, 600, 2160, 10);
    }

    // Resolution Presets
    let resolutionPresets = [];
    if (configData['engine::WindowSettings']) {
        resolutionPresets = configData['engine::WindowSettings'].values || [];
    }

    if (resolutionPresets.length > 0) {
        resolutionPresets.forEach((preset, index) => {
            if (preset.value && preset.value['resolution fullscreen']) {
                const group = createSettingsGroup(preset.key || `Resolution Preset ${index + 1}`);
                tab.appendChild(group);
                createRangeInput(group, 'Width', 'width', preset.value['resolution fullscreen'], 800, 7680, 10);
                createRangeInput(group, 'Height', 'height', preset.value['resolution fullscreen'], 600, 4320, 10);
            }
        });
    }
}

function renderPerformanceSettings() {
    const tab = document.getElementById('performance-tab');
    const frameLimiterSettings = configData['FrameLimiterSettings'] || {};

    tab.innerHTML = '';

    if (frameLimiterSettings.client) {
        const clientGroup = createSettingsGroup('Active Client Frame Limiter');
        tab.appendChild(clientGroup);
        createRangeInput(clientGroup, 'Frequency (FPS)', 'frequency', frameLimiterSettings.client, 30, 360, 1);
        createRangeInput(clientGroup, 'Carried Overspent', 'carriedOverspent', frameLimiterSettings.client, 0.1, 1.0, 0.05);
    }

    if (frameLimiterSettings['inactive client']) {
        const inactiveGroup = createSettingsGroup('Inactive Client Frame Limiter');
        tab.appendChild(inactiveGroup);
        createRangeInput(inactiveGroup, 'Frequency (FPS)', 'frequency', frameLimiterSettings['inactive client'], 10, 144, 1);
        createRangeInput(inactiveGroup, 'Carried Overspent', 'carriedOverspent', frameLimiterSettings['inactive client'], 0.1, 1.0, 0.05);
    }
}

function updateMarkerSettings() {
    if (!configData || !markerTypeSelect || !markerStateSelect || !markerSettingsContent) return;

    const markerType = markerTypeSelect.value;
    const markerState = markerStateSelect.value;

    const markerSettings = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] || {};
    const vehicleMarkerSettings = markerSettings['Vehicle Marker Settings'] || {};

    let currentSettings = null;

    if (vehicleMarkerSettings['markerSettings']) {
        const typeKey = `${markerType}MarkerSettings`;
        if (vehicleMarkerSettings['markerSettings'][typeKey] &&
            vehicleMarkerSettings['markerSettings'][typeKey]['markerSettings'] &&
            vehicleMarkerSettings['markerSettings'][typeKey]['markerSettings'][markerState]) {
            currentSettings = vehicleMarkerSettings['markerSettings'][typeKey]['markerSettings'][markerState];
        }
    }

    // If no settings found, use defaults
    if (!currentSettings) {
        currentSettings = defaultValues.markers[markerType][markerState] || {};
    }

    // Clear and populate content
    markerSettingsContent.innerHTML = '';

    const group = createSettingsGroup(`${markerType.charAt(0).toUpperCase() + markerType.slice(1)} - ${markerState}`);
    markerSettingsContent.appendChild(group);

    // Create settings for current state
    if (currentSettings.opacity !== undefined) {
        createRangeInput(group, 'Opacity', 'opacity', currentSettings, 0, 1, 0.05);
    }

    Object.keys(currentSettings).forEach(key => {
        if (typeof currentSettings[key] === 'boolean') {
            const label = key.replace('is', '').replace(/([A-Z])/g, ' $1').trim();
            createCheckbox(group, label, key, currentSettings);
        }
    });
}

// Helper functions for creating UI elements
function createSettingsGroup(title) {
    const group = document.createElement('div');
    group.className = 'settings-group';

    const heading = document.createElement('h4');
    heading.textContent = title;
    group.appendChild(heading);

    return group;
}

function createRangeInput(container, label, key, settingsObj, min, max, step) {
    const value = settingsObj[key] !== undefined ? settingsObj[key] : min;

    const item = document.createElement('div');
    item.className = 'setting-item';

    const labelEl = document.createElement('div');
    labelEl.className = 'setting-label';
    labelEl.textContent = label;

    const control = document.createElement('div');
    control.className = 'setting-control';

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'range-input';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;

    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'setting-value';
    valueDisplay.textContent = parseFloat(value).toFixed(2);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>';
    resetBtn.title = 'Reset to default';

    input.addEventListener('input', (e) => {
        const newValue = parseFloat(e.target.value);
        settingsObj[key] = newValue;
        valueDisplay.textContent = newValue.toFixed(2);
    });

    resetBtn.addEventListener('click', () => {
        const defaultValue = getDefaultValue(settingsObj, key) || min;
        settingsObj[key] = defaultValue;
        input.value = defaultValue;
        valueDisplay.textContent = parseFloat(defaultValue).toFixed(2);
    });

    control.appendChild(input);
    control.appendChild(valueDisplay);
    control.appendChild(resetBtn);

    item.appendChild(labelEl);
    item.appendChild(control);

    container.appendChild(item);
}

function createCheckbox(container, label, key, settingsObj) {
    const value = settingsObj[key] !== undefined ? settingsObj[key] : false;

    const item = document.createElement('div');
    item.className = 'setting-item';

    const labelEl = document.createElement('div');
    labelEl.className = 'setting-label';
    labelEl.textContent = label;

    const control = document.createElement('div');
    control.className = 'setting-control';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'checkbox-input';
    input.checked = value;

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.innerHTML = '↺';
    resetBtn.title = 'Reset to default';

    input.addEventListener('change', (e) => {
        settingsObj[key] = e.target.checked;
    });

    resetBtn.addEventListener('click', () => {
        const defaultValue = getDefaultValue(settingsObj, key) || false;
        settingsObj[key] = defaultValue;
        input.checked = defaultValue;
    });

    control.appendChild(input);
    control.appendChild(resetBtn);

    item.appendChild(labelEl);
    item.appendChild(control);

    container.appendChild(item);
}

function createDropdown(container, label, key, settingsObj, options) {
    const value = settingsObj[key] !== undefined ? settingsObj[key] : options[0];

    const item = document.createElement('div');
    item.className = 'setting-item';

    const labelEl = document.createElement('div');
    labelEl.className = 'setting-label';
    labelEl.textContent = label;

    const control = document.createElement('div');
    control.className = 'setting-control';

    const select = document.createElement('select');
    select.className = 'dropdown-input';

    options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        optionEl.selected = option === value;
        select.appendChild(optionEl);
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.innerHTML = '↺';
    resetBtn.title = 'Reset to default';

    select.addEventListener('change', (e) => {
        settingsObj[key] = e.target.value;
    });

    resetBtn.addEventListener('click', () => {
        const defaultValue = getDefaultValue(settingsObj, key) || options[0];
        settingsObj[key] = defaultValue;
        select.value = defaultValue;
    });

    control.appendChild(select);
    control.appendChild(resetBtn);

    item.appendChild(labelEl);
    item.appendChild(control);

    container.appendChild(item);
}

function getDefaultValue(settingsObj, key) {
    // Determine which default object to use based on the settings object
    if (settingsObj === configData['cw::AimingProjectSettings']) {
        return defaultValues.aiming[key];
    } else if (settingsObj === configData['cw::FollowAimSettings']) {
        return defaultValues.followAim[key];
    } else if (settingsObj === configData['cw::ArmorOutlinerProjectSettings']) {
        return defaultValues.armorOutliner[key];
    } else if (settingsObj === configData['cw::HapticsProjectSettings']) {
        return defaultValues.haptics[key];
    } else if (settingsObj === configData['engine::WindowProjectSettings']?.minSize) {
        return defaultValues.window.minSize[key];
    } else if (settingsObj === configData['FrameLimiterSettings']?.client) {
        return defaultValues.frameLimiter.client[key];
    } else if (settingsObj === configData['FrameLimiterSettings']?.['inactive client']) {
        return defaultValues.frameLimiter['inactive client'][key];
    }
    return null;
}

async function saveConfig() {
    if (!configData || !currentFilePath) {
        showToast('No configuration loaded', 'error');
        return;
    }

    try {
        const finalConfig = originalConfig.settings ? {
            settings: configData
        } : configData;
        const result = await ipcRenderer.invoke('save-file', currentFilePath, JSON.stringify(finalConfig, null, 2));

        if (result.success) {
            showToast('Configuration saved successfully!');
        } else {
            showToast('Error saving file: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error saving configuration: ' + error.message, 'error');
    }
}

async function downloadConfig() {
    if (!configData) {
        showToast('No configuration loaded', 'error');
        return;
    }

    try {
        const fileName = currentFilePath ? currentFilePath.split(/[\\/]/).pop() : 'modified_coldwar.project';
        const result = await ipcRenderer.invoke('show-save-dialog', fileName);

        if (!result.canceled) {
            const finalConfig = originalConfig.settings ? {
                settings: configData
            } : configData;
            const saveResult = await ipcRenderer.invoke('save-file', result.filePath, JSON.stringify(finalConfig, null, 2));

            if (saveResult.success) {
                showToast('Configuration exported successfully!');
            } else {
                showToast('Error exporting file: ' + saveResult.error, 'error');
            }
        }
    } catch (error) {
        showToast('Error exporting configuration: ' + error.message, 'error');
    }
}

// Updated resetAllSettings function in renderer.js
function resetAllSettings() {
    if (!configData || !originalConfig) {
        showToast('No configuration loaded', 'error');
        return;
    }

    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');

    modalTitle.textContent = 'Reset All Settings';
    modalMessage.textContent = 'Are you sure you want to reset all settings to default values? This cannot be undone.';

    modal.classList.add('show');

    const handleConfirm = () => {
        // Reset aiming settings
        if (configData['cw::AimingProjectSettings']) {
            Object.keys(defaultValues.aiming).forEach(key => {
                configData['cw::AimingProjectSettings'][key] = defaultValues.aiming[key];
            });
        }

        // Reset follow aim settings
        if (configData['cw::FollowAimSettings']) {
            Object.keys(defaultValues.followAim).forEach(key => {
                configData['cw::FollowAimSettings'][key] = defaultValues.followAim[key];
            });
        }

        // Reset armor outliner settings
        if (configData['cw::ArmorOutlinerProjectSettings']) {
            Object.keys(defaultValues.armorOutliner).forEach(key => {
                configData['cw::ArmorOutlinerProjectSettings'][key] = defaultValues.armorOutliner[key];
            });
        }

        // Reset haptics settings
        if (configData['cw::HapticsProjectSettings']) {
            Object.keys(defaultValues.haptics).forEach(key => {
                configData['cw::HapticsProjectSettings'][key] = defaultValues.haptics[key];
            });
        }

        // Reset window settings
        if (configData['engine::WindowProjectSettings'] && configData['engine::WindowProjectSettings'].minSize) {
            Object.keys(defaultValues.window.minSize).forEach(key => {
                configData['engine::WindowProjectSettings'].minSize[key] = defaultValues.window.minSize[key];
            });
        }

        // Reset frame limiter settings
        if (configData['FrameLimiterSettings']) {
            if (configData['FrameLimiterSettings'].client) {
                Object.keys(defaultValues.frameLimiter.client).forEach(key => {
                    configData['FrameLimiterSettings'].client[key] = defaultValues.frameLimiter.client[key];
                });
            }
            if (configData['FrameLimiterSettings']['inactive client']) {
                Object.keys(defaultValues.frameLimiter['inactive client']).forEach(key => {
                    configData['FrameLimiterSettings']['inactive client'][key] = defaultValues.frameLimiter['inactive client'][key];
                });
            }
        }

        // Reset marker settings
        if (configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']) {
            const markerSettings = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'];
            if (markerSettings['Vehicle Marker Settings']?.markerSettings?.allyMarkerSettings?.markerSettings) {
                Object.assign(markerSettings['Vehicle Marker Settings'].markerSettings.allyMarkerSettings.markerSettings, defaultValues.markers.ally);
            }
            if (markerSettings['Vehicle Marker Settings']?.markerSettings?.enemyMarkerSettings?.markerSettings) {
                Object.assign(markerSettings['Vehicle Marker Settings'].markerSettings.enemyMarkerSettings.markerSettings, defaultValues.markers.enemy);
            }
            if (markerSettings['Vehicle Marker Settings']?.markerSettings?.platoonMarkerSettings?.markerSettings) {
                Object.assign(markerSettings['Vehicle Marker Settings'].markerSettings.platoonMarkerSettings.markerSettings, defaultValues.markers.platoon);
            }
        }

        // Re-render all settings
        renderAllSettings();
        showToast('All settings reset to default values');
        modal.classList.remove('show');

        // Clean up event listeners
        modalConfirm.removeEventListener('click', handleConfirm);
        modalCancel.removeEventListener('click', handleCancel);
    };

    const handleCancel = () => {
        modal.classList.remove('show');
        // Clean up event listeners
        modalConfirm.removeEventListener('click', handleConfirm);
        modalCancel.removeEventListener('click', handleCancel);
    };

    modalConfirm.addEventListener('click', handleConfirm);
    modalCancel.addEventListener('click', handleCancel);
}

// Toast notification system
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    // Create message content with optional details
    const messageContent = document.createElement('div');
    messageContent.className = 'toast-message';
    messageContent.textContent = message;
    toast.appendChild(messageContent);

    // Add troubleshooting tip for parse errors
    if (type === 'error' && message.includes('parsing')) {
        const tip = document.createElement('div');
        tip.className = 'toast-tip';
        tip.textContent = 'Tip: Make sure the file hasn\'t been modified incorrectly';
        toast.appendChild(tip);
    }

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, type === 'error' ? 5000 : 3000);
}

// Initialize splash screen fade out
setTimeout(() => {
    const splashScreen = document.getElementById('splash-screen');
    const mainApp = document.getElementById('main-app');

    if (splashScreen && mainApp) {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainApp.style.opacity = '1';
        }, 500);
    }
}, 3500);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (configData) {
            saveConfig();
        }
    }

    // Ctrl+O or Cmd+O to open
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        loadConfigFile();
    }

    // Ctrl+R or Cmd+R to reset (with confirmation)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (configData) {
            resetAllSettings();
        }
    }

    // Escape to close modals/dialogs
    if (e.key === 'Escape') {
        const modal = document.getElementById('confirmationModal');
        if (modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    }
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    // Handle responsive layout changes if needed
    const settingsContainer = document.querySelector('.settings-container');
    if (settingsContainer && window.innerWidth < 768) {
        settingsContainer.classList.add('mobile-layout');
    } else if (settingsContainer) {
        settingsContainer.classList.remove('mobile-layout');
    }
});

// Handle drag and drop for the entire window
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const projectFile = files.find(file => file.name.endsWith('.project'));

    if (projectFile) {
        // Handle the dropped file
        try {
            const fileContent = await projectFile.text();
            configData = JSON.parse(fileContent);
            originalConfig = JSON.parse(fileContent);
            currentFilePath = projectFile.path || projectFile.name;

            // Check if this is the new format with "settings" wrapper
            if (configData.settings) {
                configData = configData.settings;
            }

            // Update UI
            const fileName = projectFile.name;
            if (fileNameEl) fileNameEl.textContent = fileName;
            if (filePathEl) filePathEl.textContent = currentFilePath;

            // Show config content
            if (fileSection) fileSection.style.display = 'none';
            if (configContent) configContent.style.display = 'flex';

            // Render all settings
            renderAllSettings();

            showToast('Configuration file loaded successfully!');
        } catch (error) {
            showToast('Error parsing dropped file: ' + error.message, 'error');
        }
    } else {
        showToast('Please drop a valid .project file', 'error');
    }
});

// Auto-save functionality (optional)
let autoSaveTimeout;

function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (configData && currentFilePath) {
            // Could implement auto-save here
            console.log('Auto-save would trigger here');
        }
    }, 30000); // 30 seconds
}

// Call scheduleAutoSave whenever settings change
document.addEventListener('input', scheduleAutoSave);
document.addEventListener('change', scheduleAutoSave);