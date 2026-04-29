=== Validation API Settings ===

Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Admin settings page for the Validation API plugin. Configure the level of each registered validation check.

== Description ==

Validation API Settings is a companion plugin for the [Validation API](https://github.com/troychaplin/validation-api) plugin. It adds a top-level admin settings page where site administrators can override the level (error, warning, or disabled) of each registered validation check.

**Features**

* Override individual check levels to error, warning, or disabled
* Sortable table with columns for description, target, check type, plugin, and level
* Resolves block type slugs and post type slugs to human-readable titles
* Only saves overrides that differ from the default level
* Checks can opt out of the settings page via `configurable => false` in the core plugin

**Scopes**

The plugin supports overrides for three check scopes:

* **Block** -- checks that target a specific block type
* **Meta** -- checks that target a meta key within a post type
* **Editor** -- checks that target a post type in the editor

== Installation ==

1. Install and activate the [Validation API](https://github.com/troychaplin/validation-api) plugin.
2. Upload the `validation-api-settings` folder to `wp-content/plugins/`.
3. Activate the plugin through the Plugins menu in WordPress.
4. Navigate to the Validation API menu item in the admin sidebar.

== Frequently Asked Questions ==

= Does this plugin work without the Validation API plugin? =

No. The Validation API plugin must be installed and active. This is enforced by the `Requires Plugins` header.

= How do I prevent a check from appearing on the settings page? =

Register the check with `configurable => false` in the core Validation API plugin. It will be excluded from the settings table.

= Where are overrides stored? =

Overrides are stored in the `validation_api_settings` option in the `wp_options` table.

== Changelog ==

= 1.0.0 =

* Initial release.
