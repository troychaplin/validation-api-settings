<img src="assets/icon-256x256.png" alt="Validation API Settings Plugin Banner" style="float: left; margin-right: 1.5em; height: auto; width: 128px;">

# Validation API Settings Add-on

Admin settings page for the [Validation API](https://github.com/troychaplin/validation-api) plugin. Adds a top-level menu page where site administrators can configure the level (error, warning, or disabled) of each registered validation check.

## Requirements

- WordPress 6.5+
- PHP 7.4+
- [Validation API](https://github.com/troychaplin/validation-api) plugin (active)

## Features

- Override individual check levels to error, warning, or disabled
- Sortable table with columns for description, target, check type, plugin, and level
- Resolves block type slugs and post type slugs to human-readable titles
- Only saves overrides that differ from the default level
- Checks can opt out via `configurable => false` in the core plugin

## Architecture

```
validation-api-settings.php          Plugin entry point
includes/
  Core/Plugin.php                    Admin menu, REST routes, asset enqueue
  Rest/SettingsController.php        GET/POST at /validation-api-settings/v1/validation-settings
  Filter/LevelOverride.php           Hooks wp_validation_check_level to apply overrides
src/settings/
  index.js                           Entry point, renders App
  App.js                             Main React component (table, sorting, save)
  components/SeveritySelect.js       Level dropdown (error/warning/disabled)
  utils/transform.js                 Flattens nested API response into table rows
  styles.scss                        Settings page styles
```

### Scopes

The plugin supports overrides for three check scopes:

| Scope | Structure | Target resolution |
|-------|-----------|-------------------|
| Block | `block[blockType][checkName]` | Block type slug to title |
| Meta | `meta[postType][metaKey][checkName]` | Meta key (Post Type Label) |
| Editor | `editor[postType][checkName]` | Post type slug to singular label |

### REST API

**Namespace:** `validation-api-settings/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/validation-settings` | Retrieve current overrides |
| POST | `/validation-settings` | Save overrides (requires `manage_options`) |

Overrides are stored in the `validation_api_settings` option in `wp_options`.

## Development

```bash
# Install dependencies
composer install
npm install

# Development build with watch
npm start

# Production build
npm run build
```

## License

GPL-2.0-or-later
