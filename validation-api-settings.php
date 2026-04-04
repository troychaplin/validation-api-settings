<?php
/**
 * Plugin Name:       Validation API Settings
 * Description:       Admin settings page for the Validation API plugin. Adds a top-level menu page where site administrators can configure the level (error, warning, or disabled) of each registered validation check.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Requires Plugins:  validation-api
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       validation-api-settings
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'VALIDATION_API_SETTINGS_VERSION', '1.0.0' );
define( 'VALIDATION_API_SETTINGS_FILE', __FILE__ );
define( 'VALIDATION_API_SETTINGS_DIR', plugin_dir_path( __FILE__ ) );

require_once VALIDATION_API_SETTINGS_DIR . 'vendor/autoload.php';

add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'ValidationAPI\\Core\\Plugin' ) ) {
		return;
	}

	$plugin = new ValidationAPISettings\Core\Plugin();
	$plugin->init();
} );
