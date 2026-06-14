const { ipcRenderer } = require('electron');

// Application state
let configData = null;
let originalFileContent = null;
let originalSettings = null;
let currentFilePath = null;
let hasAttemptedAutoLoad = false;

// Default values for each settings section
const defaultValues = {
    aiming: {
        "aimAssistSensitivityMultiplierAt500M": 0.5,
        "aimAssistSensitivityMultiplierAtZeroM": 0.5,
        "aimAssistTargetLockOnTime": 0.0,
        "cqcAimPointAngleThreshold": 30.0,
        "cqcAimPointDepth": 0.35,
        "cqcAimPointDistanceThreshold": 10.0,
        "distanceUpdateSpeed": 600.0,
        "maxAimingAngleError": 25.0,
        "maxDistance": 2000.0,
        "minDistance": 35.0,
        "stopType": "StopByRotation",
        "useLocalAimPoint": true,
        "useLocalDispersion": true
    },
    followAim: {
        "followAimAccMagnetMin": 0.1,
        "followAimAccMagnetMult": 0.2,
        "followAimCentringTime": 0.3,
        "followAimDecMagnetMin": 0.1,
        "followAimDecMagnetMult": 0.2,
        "followAimMaxMagnetPower": 0.2,
        "followAimMaxTargetDistance": 500.0,
        "followAimMinMagnetDistanceFromCenterPower": 0.3,
        "followAimMinRadiusScalingDistance": 200.0,
        "followAimRotationPullFactor": 0.1,
        "followAimSelectorCenterCoef": 1.5,
        "followAimSelectorCenterMin": 0.5,
        "followAimSelectorDistanceCoef": 0.3,
        "followAimSensitivityFactor": 0.55,
        "followAimTankCentringSize": 40.0,
        "followInnerRadius": 3.5,
        "followRadius": 4.3
    },
    armorOutliner: {
        "Default Mode": "Full",
        "Is Enabled": true,
        "Max Distance": 500.0
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
            "carriedOverspent": 0.4,
            "frequency": 1000.0
        },
        "inactive client": {
            "carriedOverspent": 0.4,
            "frequency": 30.0
        }
    },
    markers: {
        "ally": {
            "InDirectVisible": { "opacity": 1.0, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": true, "isDistanceEnabled": true },
            "Dead": { "opacity": 0.5, "isEnabled": true, "isNameEnabled": false, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "DeadHotKey": { "opacity": 0.7, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "DeadInAiming": { "opacity": 0.3, "isEnabled": false, "isNameEnabled": false, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "InDirectInvisible": { "opacity": 0.8, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": true, "isDistanceEnabled": true }
        },
        "enemy": {
            "InDirectVisible": { "opacity": 1.0, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": true, "isDistanceEnabled": true },
            "Dead": { "opacity": 0.5, "isEnabled": true, "isNameEnabled": false, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "DeadHotKey": { "opacity": 0.7, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "DeadInAiming": { "opacity": 0.3, "isEnabled": false, "isNameEnabled": false, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "InDirectInvisible": { "opacity": 0.8, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": true, "isDistanceEnabled": true }
        },
        "platoon": {
            "InDirectVisible": { "opacity": 1.0, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": true, "isDistanceEnabled": true },
            "Dead": { "opacity": 0.5, "isEnabled": true, "isNameEnabled": false, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "DeadHotKey": { "opacity": 0.7, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "DeadInAiming": { "opacity": 0.3, "isEnabled": false, "isNameEnabled": false, "isHealthBarEnabled": false, "isDistanceEnabled": false },
            "InDirectInvisible": { "opacity": 0.8, "isEnabled": true, "isNameEnabled": true, "isHealthBarEnabled": true, "isDistanceEnabled": true }
        }
    }
};

// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const mainApp = document.getElementById('main-app');
const browseFileBtn = document.getElementById('browseFile');
const saveConfigBtn = document.getElementById('saveConfig');
const downloadConfigBtn = document.getElementById('downloadConfig');
const resetAllBtn = document.getElementById('resetAll');

// Options
const gamePathInput = document.getElementById('gamePathInput');
const browseGamePathBtn = document.getElementById('browseGamePath');
const clearGamePathBtn = document.getElementById('clearGamePath');
const autoLoadCheckbox = document.getElementById('autoLoadCheckbox');

// Window controls
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

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadOptions();
});

async function initializeApp() {
    minimizeBtn.addEventListener('click', () => ipcRenderer.invoke('window-minimize'));
    maximizeBtn.addEventListener('click', async () => {
        await ipcRenderer.invoke('window-maximize');
        updateMaximizeButton();
    });
    closeBtn.addEventListener('click', () => ipcRenderer.invoke('window-close'));

    browseFileBtn.addEventListener('click', loadConfigFile);
    saveConfigBtn.addEventListener('click', saveConfig);
    downloadConfigBtn.addEventListener('click', downloadConfig);
    resetAllBtn.addEventListener('click', resetAllSettings);
    browseGamePathBtn.addEventListener('click', browseGamePath);
    clearGamePathBtn.addEventListener('click', clearGamePath);
    autoLoadCheckbox.addEventListener('change', saveOptions);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (markerTypeSelect) markerTypeSelect.addEventListener('change', updateMarkerSettings);
    if (markerStateSelect) markerStateSelect.addEventListener('change', updateMarkerSettings);

    updateMaximizeButton();
    await loadOptions();
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
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    tabContents.forEach(content => content.classList.remove('active'));
    const targetTab = document.getElementById(`${tabId}-tab`);
    if (targetTab) targetTab.classList.add('active');
}

// ========== File Loading ==========
async function loadConfigFile() {
    try {
        hasAttemptedAutoLoad = true;
        const result = await ipcRenderer.invoke('show-open-dialog');
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            await loadAndParseFile(filePath);
        }
    } catch (error) {
        console.error('File loading error:', error);
        showToast('Error loading file: ' + error.message, 'error');
    }
}

async function loadAndParseFile(filePath) {
    try {
        const fileResult = await ipcRenderer.invoke('read-file', filePath);
        if (!fileResult.success) {
            showToast('Error reading file: ' + fileResult.error, 'error');
            return;
        }

        const content = fileResult.content;
        let parsed;

        try {
            parsed = JSON.parse(content);
        } catch (parseError) {
            const cleanedContent = cleanJsonContent(content);
            parsed = JSON.parse(cleanedContent);
        }

        // Extract settings from the parsed file
        if (parsed.settings) {
            configData = parsed.settings;
        } else {
            // If no settings wrapper, assume the whole file is settings
            configData = parsed;
        }

        originalFileContent = content;
        originalSettings = JSON.parse(JSON.stringify(configData));
        currentFilePath = filePath;

        // Save local settings
        try {
            const settings = {
                configPath: filePath,
                gamePath: gamePathInput.value || '',
                autoLoad: autoLoadCheckbox.checked
            };
            await ipcRenderer.invoke('save-local-settings', filePath, settings);
        } catch (saveError) {
            console.error('Error saving local settings:', saveError);
        }

        // Enable tabs and show action bar
        tabBtns.forEach(btn => {
            if (btn.dataset.tab !== 'home') {
                btn.classList.remove('disabled');
                btn.disabled = false;
            }
        });
        const actionBar = document.getElementById('actionBar');
        if (actionBar) actionBar.style.display = 'flex';

        // Switch to first settings tab
        switchTab('aiming');
        renderAllSettings();

        showToast('Configuration file loaded successfully!');
    } catch (error) {
        console.error('Parse error:', error);
        showToast('Error parsing file: ' + error.message, 'error');
    }
}

function cleanJsonContent(content) {
    return content
        .replace(/^\uFEFF/, '')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
}

// ========== Options Management ==========
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
            const configResult = await ipcRenderer.invoke('check-config-exists', path);
            if (configResult.exists) {
                await loadAndParseFile(configResult.path);
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
        await ipcRenderer.invoke('save-options', options);
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

async function loadOptions() {
    try {
        const options = await ipcRenderer.invoke('load-options');
        if (options) {
            gamePathInput.value = options.gamePath || '';
            autoLoadCheckbox.checked = options.autoLoad !== false;
            if (!hasAttemptedAutoLoad && options.autoLoad !== false && options.gamePath) {
                hasAttemptedAutoLoad = true;
                setTimeout(async () => {
                    try {
                        const result = await ipcRenderer.invoke('check-config-exists', options.gamePath);
                        if (result.exists) {
                            await loadAndParseFile(result.path);
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

// ========== Settings Rendering ==========
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

function renderOptionsSettings() {
    if (configData && configData.options) {
        gamePathInput.value = configData.options.gamePath || '';
        autoLoadCheckbox.checked = configData.options.autoLoad !== false;
    }
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
    createRangeInput(group, 'Distance Update Speed', 'distanceUpdateSpeed', aimingSettings, 1, 1000, 10);
    createRangeInput(group, 'Max Aiming Angle Error', 'maxAimingAngleError', aimingSettings, 1, 90, 1);
    createRangeInput(group, 'Max Distance', 'maxDistance', aimingSettings, 100, 5000, 10);
    createRangeInput(group, 'Min Distance', 'minDistance', aimingSettings, 1, 100, 1);
    createRangeInput(group, 'CQC Aim Point Angle Threshold', 'cqcAimPointAngleThreshold', aimingSettings, 0, 90, 1);
    createRangeInput(group, 'CQC Aim Point Depth', 'cqcAimPointDepth', aimingSettings, 0, 1, 0.05);
    createRangeInput(group, 'CQC Aim Point Distance Threshold', 'cqcAimPointDistanceThreshold', aimingSettings, 0, 50, 1);
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
    createRangeInput(group, 'Tank Centring Size', 'followAimTankCentringSize', followAimSettings, 10, 100, 5);
}

function renderArmorOutlinerSettings() {
    const tab = document.getElementById('armor-tab');
    const armorSettings = configData['cw::ArmorOutlinerProjectSettings'] || {};
    tab.innerHTML = '';
    const group = createSettingsGroup('Armor Detection');
    tab.appendChild(group);
    createRangeInput(group, 'Max Distance', 'Max Distance', armorSettings, 100, 1000, 10);
    const modeOptions = ['Full', 'Partial', 'Off'];
    createDropdown(group, 'Default Mode', 'Default Mode', armorSettings, modeOptions);
    createCheckbox(group, 'Enable Armor Outliner', 'Is Enabled', armorSettings);
}

function renderHapticsSettings() {
    const tab = document.getElementById('controller-tab');
    const hapticsSettings = configData['cw::HapticsProjectSettings'] || {};
    tab.innerHTML = '';
    const heavyGroup = createSettingsGroup('Heavy Rumble');
    tab.appendChild(heavyGroup);
    createRangeInput(heavyGroup, 'Duration (ms)', 'heavyRumbleDurationMS', hapticsSettings, 100, 1000, 10);
    createRangeInput(heavyGroup, 'High Frequency', 'heavyRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
    createRangeInput(heavyGroup, 'Low Frequency', 'heavyRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);
    const mediumGroup = createSettingsGroup('Medium Rumble');
    tab.appendChild(mediumGroup);
    createRangeInput(mediumGroup, 'Duration (ms)', 'mediumRumbleDurationMS', hapticsSettings, 100, 1000, 10);
    createRangeInput(mediumGroup, 'High Frequency', 'mediumRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
    createRangeInput(mediumGroup, 'Low Frequency', 'mediumRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);
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
    const typeKey = `${markerType}MarkerSettings`;
    if (vehicleMarkerSettings.markerSettings &&
        vehicleMarkerSettings.markerSettings[typeKey] &&
        vehicleMarkerSettings.markerSettings[typeKey].markerSettings &&
        vehicleMarkerSettings.markerSettings[typeKey].markerSettings[markerState]) {
        currentSettings = vehicleMarkerSettings.markerSettings[typeKey].markerSettings[markerState];
    }
    if (!currentSettings) {
        currentSettings = defaultValues.markers[markerType][markerState] || {};
    }
    markerSettingsContent.innerHTML = '';
    const group = createSettingsGroup(`${markerType.charAt(0).toUpperCase() + markerType.slice(1)} - ${markerState}`);
    markerSettingsContent.appendChild(group);
    if (currentSettings.opacity !== undefined) {
        createRangeInput(group, 'Opacity', 'opacity', currentSettings, 0, 1, 0.05);
    }
    const boolProps = ['isEnabled', 'isNameEnabled', 'isHealthBarEnabled', 'isDistanceEnabled'];
    boolProps.forEach(prop => {
        if (currentSettings[prop] !== undefined) {
            const label = prop.replace('is', '').replace(/([A-Z])/g, ' $1').trim();
            createCheckbox(group, label, prop, currentSettings);
        }
    });
}

// ========== UI Helper Functions ==========
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
        if (option === value) optionEl.selected = true;
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
    if (settingsObj === configData?.['cw::AimingProjectSettings']) return defaultValues.aiming[key];
    if (settingsObj === configData?.['cw::FollowAimSettings']) return defaultValues.followAim[key];
    if (settingsObj === configData?.['cw::ArmorOutlinerProjectSettings']) return defaultValues.armorOutliner[key];
    if (settingsObj === configData?.['cw::HapticsProjectSettings']) return defaultValues.haptics[key];
    if (settingsObj === configData?.['engine::WindowProjectSettings']?.minSize) return defaultValues.window.minSize[key];
    if (settingsObj === configData?.['FrameLimiterSettings']?.client) return defaultValues.frameLimiter.client[key];
    if (settingsObj === configData?.['FrameLimiterSettings']?.['inactive client']) return defaultValues.frameLimiter['inactive client'][key];
    return null;
}

// ========== Save Functions ==========
async function saveConfig() {
    if (!configData || !currentFilePath || !originalFileContent) {
        showToast('No configuration loaded', 'error');
        return;
    }
    try {
        const settingsToSave = {};
        settingsToSave['cw::AimingProjectSettings'] = configData['cw::AimingProjectSettings'];
        settingsToSave['cw::FollowAimSettings'] = configData['cw::FollowAimSettings'];
        settingsToSave['cw::ArmorOutlinerProjectSettings'] = configData['cw::ArmorOutlinerProjectSettings'];
        settingsToSave['cw::HapticsProjectSettings'] = configData['cw::HapticsProjectSettings'];
        settingsToSave['engine::WindowProjectSettings'] = configData['engine::WindowProjectSettings'];
        settingsToSave['FrameLimiterSettings'] = configData['FrameLimiterSettings'];
        settingsToSave['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'];

        const result = await ipcRenderer.invoke('save-file', currentFilePath, originalFileContent, settingsToSave);
        if (result.success) {
            originalFileContent = JSON.stringify(JSON.parse(originalFileContent), null, 2);
            originalSettings = JSON.parse(JSON.stringify(configData));
            showToast('Configuration saved successfully!');
        } else {
            showToast('Error saving file: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error saving configuration: ' + error.message, 'error');
    }
}

async function downloadConfig() {
    if (!configData || !originalFileContent) {
        showToast('No configuration loaded', 'error');
        return;
    }
    try {
        const fileName = currentFilePath ? currentFilePath.split(/[\\/]/).pop() : 'modified_coldwar.project';
        const result = await ipcRenderer.invoke('show-save-dialog', fileName);
        if (!result.canceled) {
            const settingsToSave = {};
            settingsToSave['cw::AimingProjectSettings'] = configData['cw::AimingProjectSettings'];
            settingsToSave['cw::FollowAimSettings'] = configData['cw::FollowAimSettings'];
            settingsToSave['cw::ArmorOutlinerProjectSettings'] = configData['cw::ArmorOutlinerProjectSettings'];
            settingsToSave['cw::HapticsProjectSettings'] = configData['cw::HapticsProjectSettings'];
            settingsToSave['engine::WindowProjectSettings'] = configData['engine::WindowProjectSettings'];
            settingsToSave['FrameLimiterSettings'] = configData['FrameLimiterSettings'];
            settingsToSave['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'];

            const saveResult = await ipcRenderer.invoke('save-as-file', result.filePath, originalFileContent, settingsToSave);
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

// ========== Reset Function ==========
function resetAllSettings() {
    if (!configData) {
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
        if (configData['cw::AimingProjectSettings']) {
            Object.assign(configData['cw::AimingProjectSettings'], JSON.parse(JSON.stringify(defaultValues.aiming)));
        }
        if (configData['cw::FollowAimSettings']) {
            Object.assign(configData['cw::FollowAimSettings'], JSON.parse(JSON.stringify(defaultValues.followAim)));
        }
        if (configData['cw::ArmorOutlinerProjectSettings']) {
            Object.assign(configData['cw::ArmorOutlinerProjectSettings'], JSON.parse(JSON.stringify(defaultValues.armorOutliner)));
        }
        if (configData['cw::HapticsProjectSettings']) {
            Object.assign(configData['cw::HapticsProjectSettings'], JSON.parse(JSON.stringify(defaultValues.haptics)));
        }
        if (configData['engine::WindowProjectSettings'] && configData['engine::WindowProjectSettings'].minSize) {
            Object.assign(configData['engine::WindowProjectSettings'].minSize, JSON.parse(JSON.stringify(defaultValues.window.minSize)));
        }
        if (configData['FrameLimiterSettings']) {
            if (configData['FrameLimiterSettings'].client) {
                Object.assign(configData['FrameLimiterSettings'].client, JSON.parse(JSON.stringify(defaultValues.frameLimiter.client)));
            }
            if (configData['FrameLimiterSettings']['inactive client']) {
                Object.assign(configData['FrameLimiterSettings']['inactive client'], JSON.parse(JSON.stringify(defaultValues.frameLimiter['inactive client'])));
            }
        }
        if (configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] &&
            configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']['Vehicle Marker Settings'] &&
            configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']['Vehicle Marker Settings'].markerSettings) {
            const markerSettings = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']['Vehicle Marker Settings'].markerSettings;
            if (markerSettings.allyMarkerSettings && markerSettings.allyMarkerSettings.markerSettings) {
                Object.assign(markerSettings.allyMarkerSettings.markerSettings, JSON.parse(JSON.stringify(defaultValues.markers.ally)));
            }
            if (markerSettings.enemyMarkerSettings && markerSettings.enemyMarkerSettings.markerSettings) {
                Object.assign(markerSettings.enemyMarkerSettings.markerSettings, JSON.parse(JSON.stringify(defaultValues.markers.enemy)));
            }
            if (markerSettings.platoonMarkerSettings && markerSettings.platoonMarkerSettings.markerSettings) {
                Object.assign(markerSettings.platoonMarkerSettings.markerSettings, JSON.parse(JSON.stringify(defaultValues.markers.platoon)));
            }
        }
        renderAllSettings();
        showToast('All settings reset to default values');
        modal.classList.remove('show');
        modalConfirm.removeEventListener('click', handleConfirm);
        modalCancel.removeEventListener('click', handleCancel);
    };

    const handleCancel = () => {
        modal.classList.remove('show');
        modalConfirm.removeEventListener('click', handleConfirm);
        modalCancel.removeEventListener('click', handleCancel);
    };

    modalConfirm.addEventListener('click', handleConfirm);
    modalCancel.addEventListener('click', handleCancel);
}

// ========== Toast Notifications ==========
function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    const messageContent = document.createElement('div');
    messageContent.className = 'toast-message';
    messageContent.textContent = message;
    toast.appendChild(messageContent);
    if (type === 'error' && message.includes('parsing')) {
        const tip = document.createElement('div');
        tip.className = 'toast-tip';
        tip.textContent = 'Tip: Make sure the file hasn\'t been modified incorrectly';
        toast.appendChild(tip);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, type === 'error' ? 5000 : 3000);
}

// ========== Splash Screen ==========
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    const main = document.getElementById('main-app');
    if (splash && main) {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            main.style.opacity = '1';
        }, 500);
    }
}, 3500);

// ========== Keyboard Shortcuts ==========
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (configData) saveConfig();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        loadConfigFile();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (configData) resetAllSettings();
    }
    if (e.key === 'Escape') {
        const modal = document.getElementById('confirmationModal');
        if (modal.classList.contains('show')) modal.classList.remove('show');
    }
});

// ========== Drag and Drop ==========
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
        await loadAndParseFile(projectFile.path);
    } else {
        showToast('Please drop a valid .project file', 'error');
    }
});