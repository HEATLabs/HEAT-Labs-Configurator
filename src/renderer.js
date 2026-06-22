const {
    ipcRenderer
} = require('electron');

// Application state
let configData = null;
let originalFileContent = null;
let originalSettings = null;
let currentFilePath = null;
let hasAttemptedAutoLoad = false;
let editingProfileId = null;
let originalProfileData = null;

// Command line arguments state
let currentCommandLineArgs = null;
let originalCommandLineContent = null;

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
    },
    commandLine: {
        "adaptiveSyncInterval": false,
        "syncInterval": 1,
        "windowMode": "maximized",
        "windowResolution": "",
        "hideSplashScreen": false,
        "showConsole": false,
        "replayRecord": true
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

// Profiles
const profileNameInput = document.getElementById('profileNameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileList = document.getElementById('profileList');
const noProfilesMessage = document.getElementById('noProfilesMessage');

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

// ========== Tab Info Data ==========
const tabInfoData = {
    home: {
        title: 'Import Configuration',
        description: 'Load your World of Tanks: HEAT configuration file to begin editing. The configurator supports the coldwar.project file format used by the game.',
        details: [
            'Click "Browse Files" to select your coldwar.project file from your game directory',
            'You can also drag and drop a .project file directly onto the window',
            'Once loaded, all settings sections will become available for editing',
            'The file path will be automatically detected and saved for future use'
        ]
    },
    profiles: {
        title: 'Profile Management',
        description: 'Save and manage your configuration presets. Profiles allow you to quickly switch between different settings configurations without manually adjusting each value.',
        details: [
            'Enter a name and click "Save Profile" to save your current settings as a preset',
            'Profiles store all settings including aiming, armor outliner, controller, markers, and command line options',
            'Click "Load" to apply a saved profile to the current configuration',
            'Click "Edit" to modify an existing profile\'s settings',
            'Delete unwanted profiles to keep your list organized'
        ]
    },
    aiming: {
        title: 'Aiming Settings (Controller Only)',
        description: 'Configure aim assist sensitivity, target locking, and distance-based aiming parameters. These settings control how your crosshair behaves when engaging targets.',
        details: [
            'Aim Assist Sensitivity: Controls how quickly aim assist reacts at different distances',
            'Target Lock On Time: Delay before aim assist locks onto a target',
            'Distance Update Speed: How often distance calculations are refreshed',
            'Max/Min Distance: Effective range for aim assist functionality',
            'CQC Settings: Close-quarters combat aiming parameters for urban combat'
        ]
    },
    'aim-assist': {
        title: 'Aim Assist (Controller Only)',
        description: 'Fine-tune the follow aim mechanics that help track moving targets. These settings control magnet strength, centering behavior, and acceleration characteristics.',
        details: [
            'Magnet Power: Strength of aim assist tracking (Min, Max, and Multipliers)',
            'Centring Time: How quickly the crosshair returns to center',
            'Sensitivity Factor: Overall sensitivity adjustment for follow aim',
            'Inner/Outer Radius: Aim assist activation zones around the target',
            'Tank Centring Size: Deadzone size for tank crosshair centering'
        ]
    },
    armor: {
        title: 'Armor Outliner',
        description: 'Configure the armor visualization system that highlights weak points and armor thickness on enemy vehicles.',
        details: [
            'Max Distance: Maximum range at which armor outlines are visible',
            'Default Mode: Choose between Full, Partial, or Off display modes',
            'Toggle visibility of armor outlines on enemy vehicles',
            'Helps identify weak spots for more effective penetration'
        ]
    },
    controller: {
        title: 'Controller Haptics',
        description: 'Adjust controller vibration settings for different types of in-game feedback. Customize rumble intensity and duration for various actions.',
        details: [
            'Three rumble levels: Heavy, Medium, and Light',
            'Each level has independent duration and frequency controls',
            'High/Low frequency balance affects rumble feel',
            'Duration settings control how long each rumble type lasts',
            'Create custom feedback profiles for different actions'
        ]
    },
    markers: {
        title: 'Vehicle Markers',
        description: 'Configure how vehicle markers appear on your HUD. Customize visibility, opacity, and information displayed for allies, enemies, and platoon members.',
        details: [
            'Three marker types: Allies, Enemies, and Platoon members',
            'Five visibility states: Direct Visible, Dead, Dead (Hot Key), Dead (In Aiming), Direct Invisible',
            'Toggle individual elements: Name, Health Bar, Distance, and overall visibility',
            'Opacity control for each marker state and type',
            'Fine-tune marker behavior for different combat situations'
        ]
    },
    window: {
        title: 'Window & Resolution',
        description: 'Configure the game window size and resolution settings. Set minimum dimensions to ensure optimal display on your monitor.',
        details: [
            'Set minimum width and height for the game window',
            'Prevents the game from becoming too small to play comfortably',
            'Changes apply after game restart',
            'Recommended values: 1280x720 minimum, 1920x1080 for optimal play'
        ]
    },
    performance: {
        title: 'Performance & Frame Limiter',
        description: 'Control frame rate limits and performance settings for both active and inactive game windows. Optimize FPS for better performance or lower system load.',
        details: [
            'Active Client: Settings when game is in focus (default: 1000 FPS)',
            'Inactive Client: Settings when game is in background (default: 30 FPS)',
            'Carried Overspent: Smoothing factor for frame timing',
            'Lower frame rates on inactive window save system resources',
            'Higher frame rates for active window reduce input lag'
        ]
    },
    commandline: {
        title: 'Command Line Arguments',
        description: 'Configure startup arguments for the game client. These settings control how the game launches and behaves at runtime.',
        details: [
            'Replay Recording: Enable/disable replay recording functionality',
            'VSync Settings: Control vertical sync for screen tearing prevention',
            'Window Mode: Choose between Normal, Maximized, Fullscreen, or Borderless',
            'Hide Splash Screen: Skip the startup splash screen animation',
            'Show Console: Open a debug console window on launch'
        ]
    },
    options: {
        title: 'Application Options',
        description: 'Configure the configurator application settings. Set your game installation path and auto-load preferences.',
        details: [
            'Game Installation Path: Point to your World of Tanks: HEAT installation folder',
            'Auto-load config on startup: Automatically load your config when the app starts',
            'The game path is used to locate the coldwar.project file and commandline.args',
            'Changes to options are saved automatically'
        ]
    }
};

// Info modal elements
const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalDescription = document.getElementById('infoModalDescription');
const infoModalDetails = document.getElementById('infoModalDetails');
const infoModalClose = document.getElementById('infoModalClose');
const infoModalOk = document.getElementById('infoModalOk');

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadOptions();
    loadProfiles();
    initInfoModal();
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

    // Profile events
    saveProfileBtn.addEventListener('click', saveCurrentProfile);
    profileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveCurrentProfile();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (markerTypeSelect) markerTypeSelect.addEventListener('change', updateMarkerSettings);
    if (markerStateSelect) markerStateSelect.addEventListener('change', updateMarkerSettings);

    // Info button events
    document.querySelectorAll('.tab-info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabId = btn.dataset.tab;
            if (tabId && tabInfoData[tabId]) {
                showTabInfo(tabId);
            }
        });
    });

    updateMaximizeButton();
    await loadOptions();
}

function initInfoModal() {
    infoModalClose.addEventListener('click', closeInfoModal);
    infoModalOk.addEventListener('click', closeInfoModal);
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            closeInfoModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('show')) {
            closeInfoModal();
        }
    });
}

function showTabInfo(tabId) {
    const info = tabInfoData[tabId];
    if (!info) return;

    infoModalTitle.textContent = info.title;
    infoModalDescription.textContent = info.description;

    infoModalDetails.innerHTML = '';
    if (info.details && info.details.length > 0) {
        const ul = document.createElement('ul');
        info.details.forEach(detail => {
            const li = document.createElement('li');
            li.textContent = detail;
            ul.appendChild(li);
        });
        infoModalDetails.appendChild(ul);
    }

    infoModal.classList.add('show');
}

function closeInfoModal() {
    infoModal.classList.remove('show');
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

    // Refresh profile list when switching to profiles tab
    if (tabId === 'profiles') {
        loadProfiles();
    }
}

// ========== Helper: Extract game path from config file path ==========
function extractGamePathFromConfigFile(configFilePath) {
    const path = require('path');
    return path.dirname(configFilePath);
}

// ========== Helper: Auto-save game path to options ==========
async function autoSaveGamePath(gamePath) {
    if (!gamePath) return false;

    try {
        // Get current options
        const currentOptions = await ipcRenderer.invoke('load-options');
        const updatedOptions = {
            gamePath: gamePath,
            autoLoad: currentOptions?.autoLoad !== false
        };

        // Save updated options
        await ipcRenderer.invoke('save-options', updatedOptions);

        // Update UI
        gamePathInput.value = gamePath;

        showToast(`Game path automatically detected: ${gamePath}`, 'success');
        return true;
    } catch (error) {
        console.error('Error auto-saving game path:', error);
        return false;
    }
}

// ========== Profile Management ==========

async function loadProfiles() {
    try {
        const profiles = await ipcRenderer.invoke('load-profiles');
        renderProfileList(profiles);
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}

function renderProfileList(profiles) {
    const container = profileList;
    const noMsg = noProfilesMessage;

    // Clear existing profiles
    container.innerHTML = '';

    if (!profiles || profiles.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    // Sort profiles by date (newest first)
    const sortedProfiles = [...profiles].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    sortedProfiles.forEach((profile, index) => {
        const profileItem = document.createElement('div');
        profileItem.className = 'setting-item';
        profileItem.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem;';

        const info = document.createElement('div');
        info.style.cssText = 'display: flex; flex-direction: column; flex: 1;';

        const name = document.createElement('div');
        name.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 1rem;';
        name.textContent = profile.name;

        // Show editing indicator if this profile is being edited
        if (editingProfileId === profile.id) {
            const editBadge = document.createElement('span');
            editBadge.style.cssText = `
                display: inline-block;
                margin-left: 0.75rem;
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--accent-color);
                background: var(--accent-color-light);
                padding: 0.15rem 0.6rem;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            editBadge.textContent = 'Editing';
            name.appendChild(editBadge);
        }

        const meta = document.createElement('div');
        meta.style.cssText = 'font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;';
        const date = new Date(profile.createdAt);
        meta.textContent = `Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        info.appendChild(name);
        info.appendChild(meta);

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 0.5rem;';

        // If this profile is being edited, show different buttons
        if (editingProfileId === profile.id) {
            // Save Edited Profile button
            const saveEditBtn = document.createElement('button');
            saveEditBtn.className = 'btn-success';
            saveEditBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem;';
            saveEditBtn.innerHTML = 'Save Changes';
            saveEditBtn.title = 'Save changes to this profile';
            saveEditBtn.addEventListener('click', () => saveEditedProfile());

            // Cancel Edit button
            const cancelEditBtn = document.createElement('button');
            cancelEditBtn.className = 'btn-secondary';
            cancelEditBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem;';
            cancelEditBtn.innerHTML = 'Cancel Edit';
            cancelEditBtn.title = 'Cancel editing and revert changes';
            cancelEditBtn.addEventListener('click', () => cancelEditingProfile());

            actions.appendChild(saveEditBtn);
            actions.appendChild(cancelEditBtn);
        } else {
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-secondary';
            editBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem;';
            editBtn.innerHTML = 'Edit';
            editBtn.title = 'Edit this profile (changes will be applied to the editor)';

            // If another profile is being edited, disable the Edit button
            if (editingProfileId !== null) {
                editBtn.disabled = true;
                editBtn.style.opacity = '0.5';
                editBtn.style.cursor = 'not-allowed';
                editBtn.title = 'Another profile is currently being edited. Please finish or cancel that edit first.';
            } else {
                editBtn.addEventListener('click', () => startEditingProfile(profile.id));
            }

            // Load button
            const loadBtn = document.createElement('button');
            loadBtn.className = 'btn-secondary';
            loadBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem;';
            loadBtn.innerHTML = 'Load';
            loadBtn.title = 'Load this profile (changes will be applied to the editor, click Save Configuration to write to file)';
            loadBtn.addEventListener('click', () => loadProfile(profile.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger';
            deleteBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem;';
            deleteBtn.innerHTML = 'Delete';
            deleteBtn.addEventListener('click', () => deleteProfile(profile.id, profile.name));

            actions.appendChild(editBtn);
            actions.appendChild(loadBtn);
            actions.appendChild(deleteBtn);
        }

        profileItem.appendChild(info);
        profileItem.appendChild(actions);
        container.appendChild(profileItem);
    });
}

async function startEditingProfile(profileId) {
    try {
        const profile = await ipcRenderer.invoke('load-profile', profileId);
        if (!profile) {
            showToast('Profile not found.', 'error');
            return;
        }

        // Store original profile data for cancellation
        originalProfileData = JSON.parse(JSON.stringify(profile));
        editingProfileId = profileId;

        // Apply settings to configData
        if (profile.settings) {
            for (const [key, value] of Object.entries(profile.settings)) {
                if (value && typeof value === 'object') {
                    if (!configData) configData = {};
                    configData[key] = JSON.parse(JSON.stringify(value));
                }
            }
        }

        // Apply command line args
        if (profile.commandLine) {
            currentCommandLineArgs = JSON.parse(JSON.stringify(profile.commandLine));
            renderCommandLineSettings();
        }

        // Re-render all settings
        renderAllSettings();

        showToast(`Now editing profile "${profile.name}". Make your changes and click "Save Changes".`, 'success');

        // Switch to the first settings tab to show the loaded settings
        switchTab('aiming');

        // Refresh profile list to show editing indicator
        loadProfiles();

    } catch (error) {
        console.error('Error starting profile edit:', error);
        showToast('Error starting profile edit: ' + error.message, 'error');
    }
}

async function saveEditedProfile() {
    if (!editingProfileId) {
        showToast('No profile is being edited.', 'error');
        return;
    }

    if (!configData) {
        showToast('No configuration loaded.', 'error');
        return;
    }

    try {
        // Load the original profile to get its name and metadata
        const originalProfile = await ipcRenderer.invoke('load-profile', editingProfileId);
        if (!originalProfile) {
            showToast('Profile not found.', 'error');
            return;
        }

        // Gather all current settings
        const profileData = {
            name: originalProfile.name,
            settings: {
                'cw::AimingProjectSettings': configData['cw::AimingProjectSettings'] || {},
                'cw::FollowAimSettings': configData['cw::FollowAimSettings'] || {},
                'cw::ArmorOutlinerProjectSettings': configData['cw::ArmorOutlinerProjectSettings'] || {},
                'cw::HapticsProjectSettings': configData['cw::HapticsProjectSettings'] || {},
                'engine::WindowProjectSettings': configData['engine::WindowProjectSettings'] || {},
                'FrameLimiterSettings': configData['FrameLimiterSettings'] || {},
                'cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings': configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] || {}
            },
            commandLine: currentCommandLineArgs ? JSON.parse(JSON.stringify(currentCommandLineArgs)) : null,
            createdAt: originalProfile.createdAt || new Date().toISOString()
        };

        // Delete the old profile
        await ipcRenderer.invoke('delete-profile', editingProfileId);

        // Save the updated profile
        const result = await ipcRenderer.invoke('save-profile', profileData);

        if (result.success) {
            showToast(`Profile "${originalProfile.name}" updated successfully!`, 'success');
            editingProfileId = null;
            originalProfileData = null;
            loadProfiles();
        } else {
            showToast('Error updating profile.', 'error');
        }
    } catch (error) {
        console.error('Error saving edited profile:', error);
        showToast('Error saving profile: ' + error.message, 'error');
    }
}

function cancelEditingProfile() {
    if (!editingProfileId || !originalProfileData) {
        editingProfileId = null;
        originalProfileData = null;
        loadProfiles();
        return;
    }

    // Confirm cancellation
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');

    modalTitle.textContent = 'Cancel Editing';
    modalMessage.textContent = 'Are you sure you want to cancel editing? All changes made to this profile will be lost.';
    modal.classList.add('show');

    const handleConfirm = () => {
        // Revert to original profile data
        if (originalProfileData) {
            if (originalProfileData.settings) {
                for (const [key, value] of Object.entries(originalProfileData.settings)) {
                    if (value && typeof value === 'object') {
                        if (!configData) configData = {};
                        configData[key] = JSON.parse(JSON.stringify(value));
                    }
                }
            }

            if (originalProfileData.commandLine) {
                currentCommandLineArgs = JSON.parse(JSON.stringify(originalProfileData.commandLine));
                renderCommandLineSettings();
            }

            renderAllSettings();
        }

        editingProfileId = null;
        originalProfileData = null;
        loadProfiles();

        showToast('Editing cancelled. Changes reverted.', 'warning');
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

async function loadProfile(profileId) {
    try {
        const profile = await ipcRenderer.invoke('load-profile', profileId);
        if (!profile) {
            showToast('Profile not found.', 'error');
            return;
        }

        // Apply settings to configData
        if (profile.settings) {
            for (const [key, value] of Object.entries(profile.settings)) {
                if (value && typeof value === 'object') {
                    if (!configData) configData = {};
                    configData[key] = JSON.parse(JSON.stringify(value));
                }
            }
        }

        // Apply command line args
        if (profile.commandLine) {
            currentCommandLineArgs = JSON.parse(JSON.stringify(profile.commandLine));
            renderCommandLineSettings();
        }

        // Re-render all settings
        renderAllSettings();

        showToast(`Profile "${profile.name}" loaded successfully! Click "Save Configuration" to write changes to your config file.`, 'success');

        // Switch to the first settings tab to show the loaded settings
        switchTab('aiming');

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile: ' + error.message, 'error');
    }
}

async function saveCurrentProfile() {
    if (!configData) {
        showToast('No configuration loaded. Please load a config file first.', 'error');
        return;
    }

    // If editing a profile, update it instead
    if (editingProfileId) {
        await saveEditedProfile();
        return;
    }

    const name = profileNameInput.value.trim();
    if (!name) {
        showToast('Please enter a profile name.', 'error');
        profileNameInput.focus();
        return;
    }

    if (name.length > 100) {
        showToast('Profile name must be 100 characters or less.', 'error');
        return;
    }

    // Check for duplicate name
    const existingProfiles = await ipcRenderer.invoke('load-profiles');
    if (existingProfiles && existingProfiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showToast(`A profile named "${name}" already exists. Please use a different name.`, 'error');
        return;
    }

    try {
        // Gather all current settings
        const profileData = {
            name: name,
            settings: {
                'cw::AimingProjectSettings': configData['cw::AimingProjectSettings'] || {},
                'cw::FollowAimSettings': configData['cw::FollowAimSettings'] || {},
                'cw::ArmorOutlinerProjectSettings': configData['cw::ArmorOutlinerProjectSettings'] || {},
                'cw::HapticsProjectSettings': configData['cw::HapticsProjectSettings'] || {},
                'engine::WindowProjectSettings': configData['engine::WindowProjectSettings'] || {},
                'FrameLimiterSettings': configData['FrameLimiterSettings'] || {},
                'cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings': configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] || {}
            },
            commandLine: currentCommandLineArgs ? JSON.parse(JSON.stringify(currentCommandLineArgs)) : null,
            createdAt: new Date().toISOString()
        };

        await ipcRenderer.invoke('save-profile', profileData);
        showToast(`Profile "${name}" saved successfully!`);
        profileNameInput.value = '';
        loadProfiles();
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile: ' + error.message, 'error');
    }
}

async function deleteProfile(profileId, profileName) {
    // If this profile is being edited, cancel editing first
    if (editingProfileId === profileId) {
        cancelEditingProfile();
    }

    // Show confirmation modal
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');

    modalTitle.textContent = 'Delete Profile';
    modalMessage.textContent = `Are you sure you want to delete the profile "${profileName}"? This cannot be undone.`;
    modal.classList.add('show');

    const handleConfirm = async () => {
        try {
            await ipcRenderer.invoke('delete-profile', profileId);
            showToast(`Profile "${profileName}" deleted successfully.`);
            loadProfiles();
        } catch (error) {
            console.error('Error deleting profile:', error);
            showToast('Error deleting profile: ' + error.message, 'error');
        }
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

// ========== Command Line Args Functions ==========
async function loadCommandLineArgs(gamePath) {
    try {
        // Use IPC to handle path joining in main process
        const binPath = await ipcRenderer.invoke('join-path', gamePath, 'bin');
        const argsPath = await ipcRenderer.invoke('join-path', binPath, 'commandline.args');

        const result = await ipcRenderer.invoke('read-commandline-args', argsPath);
        if (result.success && result.content) {
            currentCommandLineArgs = result.content;
            originalCommandLineContent = result.content;
            parseAndApplyCommandLineArgs(result.content);
            renderCommandLineSettings();
            return true;
        }
    } catch (error) {
        console.error('Error loading commandline.args:', error);
    }
    return false;
}

function parseAndApplyCommandLineArgs(content) {
    // Default values
    const args = {
        adaptiveSyncInterval: false,
        syncInterval: 1,
        windowMode: "maximized",
        windowResolution: "",
        hideSplashScreen: false,
        showConsole: false,
        replayRecord: true
    };

    // Check for --project (we keep this always)
    // Check for --replay-record
    if (content.includes('--replay-record')) {
        args.replayRecord = true;
    } else {
        args.replayRecord = false;
    }

    // Check for -asi or --adaptiveSyncInterval
    if (content.includes('-asi') || content.includes('--adaptiveSyncInterval')) {
        args.adaptiveSyncInterval = true;
    }

    // Check for -si or --syncInterval
    const siMatch = content.match(/(?:-si|--syncInterval)\s+(\d+)/);
    if (siMatch) {
        args.syncInterval = parseInt(siMatch[1]);
    }

    // Check for -wm or --windowMode
    const wmMatch = content.match(/(?:-wm|--windowMode)\s+(\w+)(?::(\d+x\d+))?/);
    if (wmMatch) {
        args.windowMode = wmMatch[1];
        if (wmMatch[2]) {
            args.windowResolution = wmMatch[2];
        }
    }

    // Check for -hss or --hideSplashScreen
    if (content.includes('-hss') || content.includes('--hideSplashScreen')) {
        args.hideSplashScreen = true;
    }

    // Check for -sc or --showConsole
    if (content.includes('-sc') || content.includes('--showConsole')) {
        args.showConsole = true;
    }

    currentCommandLineArgs = args;
}

function buildCommandLineArgs() {
    const args = [];

    // Always include project path
    args.push('--project ../coldwar.project');
    args.push('-m client');

    // Replay record
    if (currentCommandLineArgs.replayRecord !== false) {
        args.push('--replay-record');
    }

    // Adaptive sync interval (VSync at 60 FPS)
    if (currentCommandLineArgs.adaptiveSyncInterval) {
        args.push('-asi');
    }

    // Sync interval (VSync mode)
    if (currentCommandLineArgs.syncInterval !== undefined && currentCommandLineArgs.syncInterval !== 1) {
        args.push(`-si ${currentCommandLineArgs.syncInterval}`);
    }

    // Window mode
    if (currentCommandLineArgs.windowMode && currentCommandLineArgs.windowMode !== 'maximized') {
        let windowModeArg = `-wm ${currentCommandLineArgs.windowMode}`;
        if (currentCommandLineArgs.windowResolution &&
            (currentCommandLineArgs.windowMode === 'normal' || currentCommandLineArgs.windowMode === 'fullscreen')) {
            windowModeArg += `:${currentCommandLineArgs.windowResolution}`;
        }
        args.push(windowModeArg);
    }

    // Hide splash screen
    if (currentCommandLineArgs.hideSplashScreen) {
        args.push('-hss');
    }

    // Show console
    if (currentCommandLineArgs.showConsole) {
        args.push('-sc');
    }

    return args.join(' ');
}

function renderCommandLineSettings() {
    const tab = document.getElementById('commandline-tab');
    if (!tab) return;

    if (!currentCommandLineArgs) {
        currentCommandLineArgs = JSON.parse(JSON.stringify(defaultValues.commandLine));
    }

    tab.innerHTML = '';

    // Replay Recording
    const replayGroup = createSettingsGroup('Replay Recording');
    tab.appendChild(replayGroup);
    createCheckbox(replayGroup, 'Enable Replay Recording', 'replayRecord', currentCommandLineArgs);

    // VSync Settings
    const vsyncGroup = createSettingsGroup('VSync Settings');
    tab.appendChild(vsyncGroup);
    createCheckbox(vsyncGroup, 'Adaptive Sync Interval (VSync at 60 FPS)', 'adaptiveSyncInterval', currentCommandLineArgs);

    const syncOptions = [{
            value: 0,
            label: 'Off'
        },
        {
            value: 1,
            label: 'Sync every vblank (60 FPS at 60Hz)'
        },
        {
            value: 2,
            label: 'Sync every 2nd vblank (30 FPS at 60Hz)'
        }
    ];
    createDropdownWithOptions(vsyncGroup, 'Sync Interval Mode', 'syncInterval', currentCommandLineArgs, syncOptions);

    // Window Mode Settings
    const windowGroup = createSettingsGroup('Window Mode Settings');
    tab.appendChild(windowGroup);

    const windowModeOptions = [{
            value: 'normal',
            label: 'Normal (Windowed)'
        },
        {
            value: 'maximized',
            label: 'Maximized'
        },
        {
            value: 'fullscreen',
            label: 'Fullscreen'
        },
        {
            value: 'borderless',
            label: 'Borderless Window'
        }
    ];
    createDropdownWithOptions(windowGroup, 'Window Mode', 'windowMode', currentCommandLineArgs, windowModeOptions);

    // Resolution input (only for normal/fullscreen)
    const resolutionItem = document.createElement('div');
    resolutionItem.className = 'setting-item';
    const resolutionLabel = document.createElement('div');
    resolutionLabel.className = 'setting-label';
    resolutionLabel.textContent = 'Window Resolution (for Normal/Fullscreen modes)';
    const resolutionControl = document.createElement('div');
    resolutionControl.className = 'setting-control';
    const resolutionInput = document.createElement('input');
    resolutionInput.type = 'text';
    resolutionInput.className = 'path-input';
    resolutionInput.placeholder = 'e.g., 1920x1080';
    resolutionInput.value = currentCommandLineArgs.windowResolution || '';
    resolutionInput.addEventListener('change', (e) => {
        currentCommandLineArgs.windowResolution = e.target.value;
    });
    const resolutionReset = createResetButton(() => {
        resolutionInput.value = '';
        currentCommandLineArgs.windowResolution = '';
    });
    resolutionControl.appendChild(resolutionInput);
    resolutionControl.appendChild(resolutionReset);
    resolutionItem.appendChild(resolutionLabel);
    resolutionItem.appendChild(resolutionControl);
    windowGroup.appendChild(resolutionItem);

    // Startup Settings
    const startupGroup = createSettingsGroup('Startup Settings');
    tab.appendChild(startupGroup);
    createCheckbox(startupGroup, 'Hide Splash Screen on Startup', 'hideSplashScreen', currentCommandLineArgs);
    createCheckbox(startupGroup, 'Show Console Window', 'showConsole', currentCommandLineArgs);

    // Info box
    const infoGroup = createSettingsGroup('Command Line Information');
    const previewItem = document.createElement('div');
    previewItem.className = 'setting-item';
    previewItem.style.flexDirection = 'column';
    previewItem.style.alignItems = 'flex-start';
    previewItem.style.gap = '0.5rem';

    const previewLabel = document.createElement('div');
    previewLabel.className = 'setting-label';
    previewLabel.textContent = 'Generated Command Line:';
    previewLabel.style.marginBottom = '0.5rem';

    const previewCode = document.createElement('code');
    previewCode.style.cssText = `
        background: var(--bg-primary);
        padding: 0.75rem;
        border-radius: 8px;
        font-family: monospace;
        font-size: 0.85rem;
        width: 100%;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
        color: var(--accent-color);
    `;

    function updatePreview() {
        previewCode.textContent = buildCommandLineArgs();
    }

    // Add event listeners to update preview
    const updatePreviewListener = () => updatePreview();
    // We'll use a MutationObserver or just update on any change
    const inputs = tab.querySelectorAll('input, select');

    previewItem.appendChild(previewLabel);
    previewItem.appendChild(previewCode);
    infoGroup.appendChild(previewItem);

    // Initial preview update
    setTimeout(updatePreview, 100);

    // Update preview when settings change
    tab.addEventListener('change', (e) => {
        if (e.target.matches('input, select')) {
            updatePreview();
        }
    });
}

function createDropdownWithOptions(container, label, key, settingsObj, options) {
    const value = settingsObj[key] !== undefined ? settingsObj[key] : options[0].value;
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
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        if (option.value === value) optionEl.selected = true;
        select.appendChild(optionEl);
    });
    const resetBtn = createResetButton(() => {
        const defaultValue = defaultValues.commandLine[key] !== undefined ? defaultValues.commandLine[key] : options[0].value;
        settingsObj[key] = defaultValue;
        select.value = defaultValue;
    });
    select.addEventListener('change', (e) => {
        settingsObj[key] = e.target.value;
    });
    control.appendChild(select);
    control.appendChild(resetBtn);
    item.appendChild(labelEl);
    item.appendChild(control);
    container.appendChild(item);
}

function createResetButton(onClick) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>';
    resetBtn.title = 'Reset to default';
    resetBtn.addEventListener('click', onClick);
    return resetBtn;
}

async function saveCommandLineArgs() {
    if (!gamePathInput.value) return;

    try {
        // Use IPC to handle path joining in main process
        const binPath = await ipcRenderer.invoke('join-path', gamePathInput.value, 'bin');
        const argsContent = buildCommandLineArgs();
        const result = await ipcRenderer.invoke('save-commandline-args', binPath, argsContent);
        if (result.success) {
            showToast('Changes saved successfully!');
        } else {
            showToast('Error saving changes: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving changes:', error);
    }
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

        // ===== AUTO-DETECT AND SAVE GAME PATH =====
        const detectedGamePath = extractGamePathFromConfigFile(filePath);
        if (detectedGamePath) {
            await autoSaveGamePath(detectedGamePath);

            // Also load command line args from the detected game path
            await loadCommandLineArgs(detectedGamePath);
        }

        // Save local settings
        try {
            const settings = {
                configPath: filePath,
                gamePath: gamePathInput.value || detectedGamePath || '',
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

            // Load commandline.args
            await loadCommandLineArgs(path);

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
        showToast('Changes saved successfully');
    } catch (error) {
        showToast('Error saving changes: ' + error.message, 'error');
    }
}

async function loadOptions() {
    try {
        const options = await ipcRenderer.invoke('load-options');
        if (options) {
            gamePathInput.value = options.gamePath || '';
            autoLoadCheckbox.checked = options.autoLoad !== false;

            // Load commandline.args if game path exists
            if (options.gamePath) {
                await loadCommandLineArgs(options.gamePath);
            }

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
    renderCommandLineSettings();
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
    resetBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>';
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
    resetBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>';
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
            showToast('Changes saved successfully!');

            // Also save command line args
            await saveCommandLineArgs();
        } else {
            showToast('Error saving changes: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error saving changes: ' + error.message, 'error');
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

        // Reset command line args
        if (currentCommandLineArgs) {
            currentCommandLineArgs = JSON.parse(JSON.stringify(defaultValues.commandLine));
            renderCommandLineSettings();
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
        if (infoModal.classList.contains('show')) closeInfoModal();
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