# Greenbottle's Vitality Network

A Foundry VTT module that automates vitality network point spending for Starfinder 2e Transfer Vitality actions (using Pathfinder 2e system).

## Features

- **Automatic Detection**: Triggers when a character uses the Transfer Vitality action
- **Customizable Interface**: Choose between popup dialog or chat-based interaction
- **Resource Management**: Automatically tracks and spends vitality network points
- **pf2e-toolbelt Integration**: Automatically applies healing when the toolbelt module is enabled
- **User Preferences**: Individual settings for interface style and automation level

## How It Works

When a character with vitality network points uses the Transfer Vitality action, the module:
1. Detects the action automatically
2. Prompts the user (via popup or chat) to spend vitality network points
3. Deducts the spent points from the character's resources
4. Applies healing to targeted allies (with pf2e-toolbelt integration)

## Authour Notes

1. there are some slight/ occasional issues with the dialog popup, if you are having those issues, switch to the chat message version (in settings)

## Installation

### Via Foundry Package Manager (Recommended)
1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Search for "Greenbottle's Vitality Network"
4. Click **Install**

### Manual Installation
1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Paste this manifest URL:
```
https://github.com/Ayabara1013/greenbottles-vitality-network/releases/latest/download/module.json
```
4. Click **Install**

## Usage

### Setup
1. Enable the module in your world
2. Ensure characters have the vitality network resource configured
3. (Optional) Enable pf2e-toolbelt for automatic healing application

### For Players
1. Configure your preferred interface style in module settings (popup or chat)
2. When you use Transfer Vitality, the module will automatically prompt you
3. Select how many vitality network points to spend
4. The module handles the rest!

### For GMs
The module works automatically once enabled. No additional configuration required unless you want to customize default settings for players.

## Requirements

- **Foundry VTT**: Version 13
- **Game System**: Pathfinder 2e
- **Required**: pf2e-toolbelt module
- **Recommended**: Starfinder Anachronism module (for Starfinder 2e content)

## Compatibility

- Foundry VTT v13
- Pathfinder 2e system v6.0.0+
- Works with Starfinder 2e via Starfinder Anachronism module
- Integrates with pf2e-toolbelt for automatic healing

## Credits

**Author**: Doc_ (Greenbottle)  
**Repository**: [GitHub](https://github.com/Ayabara1013/greenbottles-vitality-network)

Special thanks to the Foundry VTT, Pathfinder 2e, and Starfinder communities!

## Changelog

### v1.0.0 - Initial Release
- Automatic detection of Transfer Vitality actions
- Popup and chat-based interface options
- Vitality network point tracking and spending
- pf2e-toolbelt integration for automatic healing application
- User preference settings for interface customization

## License

This module is licensed under the MIT License.
