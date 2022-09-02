# Minimal Sun & Moon Card by [@decompil3d](https://www.github.com/decompil3d)

Minimal sun & moon status card for Home Assistant Lovelace dashboards.

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/hacs/integration)

![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]

![Screenshot of Minimal Sun & Moon card](sun-moon-card.png)

## Installation

### Easiest method:

✨ Install via HACS

### Alternative method:

1. Download `sun-moon-card.js` from the [Releases][releases] page
2. Upload to `/www/sun-moon-card/sun-moon-card.js` (via Samba, File Editor, SSH, etc.)
3. Visit the Resources page in your Home Assistant install and add `/sun-moon-card/sun-moon-card.js` as a
   JavaScript Module.
   [![Open your Home Assistant instance and show your dashboard resources.](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources/)
4. Refresh your browser

## Usage

This card will show in the "Add card" modal. It has a GUI editor for configuring settings.

If you prefer YAML, here is a sample config:

```yaml
type: custom:minimal-sun-moon
sun_entity: sun.sun
```

## Options

| Name              | Type   | Requirement  | Description                                               | Default             |
| ----------------- | ------ | ------------ | --------------------------------------------------------- | ------------------- |
| type              | string | **Required** | `custom:minimal-sun-moon`                                 |                     |
| sun_entity        | string | **Required** | Home Assistant Sun entity ID.                             | `sun.sun`           |
| moon_entity       | string | **Optional** | Home Assistant Moon entity ID.                            |                     |
| hide_sunrise      | bool   | **Optional** | Whether to hide sunrise time next to the bar              | `false`             |
| hide_sunset       | bool   | **Optional** | Whether to hide sunset time next to the bar               | `false`             |
| tap_action        | object | **Optional** | Action to take on tap                                     | `action: more-info` |
| hold_action       | object | **Optional** | Action to take on hold                                    | `none`              |
| double_tap_action | object | **Optional** | Action to take on double tap                              | `none`              |
| language          | string | **Optional** | Language to use for card (overrides HA & user settings)   |                     |

## Action Options

| Name            | Type   | Requirement  | Description                                                                                        | Default     |
| --------------- | ------ | ------------ | -------------------------------------------------------------------------------------------------- | ----------- |
| action          | string | **Required** | Action to perform (more-info, toggle, call-service, navigate url, none)                            | `more-info` |
| navigation_path | string | **Optional** | Path to navigate to (e.g. /lovelace/0/) when action defined as navigate                            | `none`      |
| url             | string | **Optional** | URL to open on click when action is url. The URL will open in a new tab                            | `none`      |
| service         | string | **Optional** | Service to call (e.g. media_player.media_play_pause) when action defined as call-service           | `none`      |
| service_data    | object | **Optional** | Service data to include (e.g. entity_id: media_player.bedroom) when action defined as call-service | `none`      |
| haptic          | string | **Optional** | Haptic feedback _success, warning, failure, light, medium, heavy, selection_                       | `none`      |
| repeat          | number | **Optional** | How often to repeat the `hold_action` in milliseconds.                                             | `none`      |

[commits-shield]: https://img.shields.io/github/commit-activity/y/decompil3d/lovelace-minimal-sun-moon-card.svg?style=for-the-badge
[commits]: https://github.com/decompil3d/lovelace-minimal-sun-moon-card/commits/master
[license-shield]: https://img.shields.io/github/license/decompil3d/lovelace-minimal-sun-moon-card.svg?style=for-the-badge
[maintenance-shield]: https://img.shields.io/maintenance/yes/2022.svg?style=for-the-badge
[releases-shield]: https://img.shields.io/github/release/decompil3d/lovelace-minimal-sun-moon-card.svg?style=for-the-badge
[releases]: https://github.com/decompil3d/lovelace-minimal-sun-moon-card/releases
