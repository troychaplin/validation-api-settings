<?php
/**
 * Validation API Settings — auto-bootstrap.
 *
 * This file is loaded automatically by Composer's `autoload.files` mechanism.
 * It initializes the settings package when the core Validation API plugin is active.
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

define( 'VALIDATION_API_SETTINGS_VERSION', '1.0.0' );
define( 'VALIDATION_API_SETTINGS_DIR', __DIR__ . '/' );

add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'ValidationAPI\\Core\\Plugin' ) ) {
		return;
	}

	$plugin = new ValidationAPISettings\Core\Plugin();
	$plugin->init();
} );
