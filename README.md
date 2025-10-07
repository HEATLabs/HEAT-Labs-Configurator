<div align="center">

# HEAT Labs - Configurator

<img src="https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/social-share/HEATLabs.png" alt="HEAT Labs Banner"/>

> One-stop solution for comprehensive statistics and insights in World of Tanks: HEAT

</div>

---

## Table of Contents

- [About](#about)  
- [Features](#features)
- [Installation](#installation)
- [Windows Security Notice](#windows-security-notice)
- [Usage](#usage)
- [Web Version](#web-version)
- [Contributing](#contributing)  
- [License](#license)  

---

##  About

The HEATLabs Configurator is a desktop application designed to provide players of World of Tanks: HEAT with advanced control over game settings that aren't accessible through the standard in-game menus. This tool allows for fine-tuning of aiming mechanics, controller haptics, UI markers, performance settings, and more.

Built using Electron, the app provides a user-friendly interface for modifying configuration files that would otherwise require manual JSON editing. The configurator includes safety features like default value restoration and validation to prevent invalid configurations.

---

## Features

- **Aiming Configuration**: Adjust sensitivity, assist settings, and targeting parameters
- **Controller Haptics**: Customize rumble intensity and duration for different events
- **UI Markers**: Fine-tune visibility and information displayed for allies, enemies, and platoon members
- **Performance Tweaks**: Modify frame limiter settings for active and inactive windows
- **Resolution Control**: Set minimum window sizes and resolution presets
- **Safety Features**: 
  - Reset to default values
  - Validation to prevent invalid settings
  - Original file backup (when saving)
- **Cross-platform**: Available for Windows, macOS, and Linux

---

## Installation

1. Download the latest release from the [Releases page](https://github.com/HEATLabs/pcw-configurator/releases)
2. For Windows: Download the `.exe` portable version
3. For macOS: Coming Soon
4. For Linux: Coming Soon

---

## Windows Security Notice

When downloading and running the PCW Configurator on Windows, you may see a warning that says "Windows protected your PC" or that the app is "not commonly downloaded." This is expected behavior because:

1. **No Code Signing Certificate**: The app isn't signed with a code signing certificate. Windows SmartScreen flags all unsigned apps as potentially dangerous.

2. **False Positive**: Some antivirus software may flag the app simply because it modifies game files, which is its intended purpose.

3. **How to Proceed**:
   - Click "More info" then "Run anyway" when you see the warning
   - You may need to add an exception in your antivirus software
   - The app is completely open-source - you can review all code before running

If you're uncomfortable with these warnings, you can use the [web version](https://heatlabs.net/playground/configurator.html) which provides similar functionality without requiring installation.

---

## Usage

1. **Load a Config File**:
   - Click "Browse Files" and select your `coldwar.project` file (typically found in the game's config folder)
   - Alternatively, drag and drop the file onto the app window

2. **Modify Settings**:
   - Navigate through tabs to find the settings you want to adjust
   - Use sliders, checkboxes, and dropdowns to customize values
   - Each setting includes a reset button to restore defaults

3. **Save Changes**:
   - "Save Configuration" overwrites the original file
   - "Export File" lets you save to a new location
   - Keyboard shortcuts:
     - Ctrl+S: Save
     - Ctrl+O: Open new file
     - Ctrl+R: Reset all settings

4. **Reset Options**:
   - Individual settings can be reset using the ↺ button
   - "Reset All" restores all settings to their default values

---

## Web Version

For users who prefer not to install software or encounter issues with the desktop app, we provide a web-based version with similar functionality:

🔗 [Web Configurator](https://heatlabs.net/playground/configurator)

The web version has some limitations compared to the desktop app:
- Cannot automatically locate your config file
- Requires manual file upload/download
- Some advanced features may be unavailable

---

## Contributing

We welcome contributions, be it code, content, bug reports, or design feedback.
If you’d like to contribute or report an issue, you can:

1. **Create an issue** in the [HEAT Labs main organization](https://github.com/HEATLabs) that holds all repositories.
2. **Contact us on Discord** via [this invite link](https://discord.heatlabs.net).
3. **Use our contact form** on the [HEAT Labs Contact Us page](https://heatlabs.net/resources/contact-us).

When submitting changes via pull requests:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Make your changes and commit (`git commit -m "Add feature to do XYZ"`)
4. Push to your fork (`git push origin feature/name`)
5. Open a pull request with a clear description of what you’ve changed

---

## License

Distributed under the GNU GPL-3.0 License. See the [LICENSE](LICENSE) file for full details. HEAT Labs is free and open-source for community use and collaboration.
