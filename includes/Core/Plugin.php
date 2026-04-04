<?php

namespace ValidationAPISettings\Core;

use ValidationAPISettings\Filter\LevelOverride;
use ValidationAPISettings\Rest\SettingsController;

class Plugin {

	/**
	 * The admin page hook suffix.
	 *
	 * @var string
	 */
	private $page_hook;

	/**
	 * Initialize the plugin.
	 */
	public function init() {
		$level_override = new LevelOverride();
		$level_override->register();

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_rest_routes() {
		$controller = new SettingsController();
		$controller->register_routes();
	}

	/**
	 * Register the top-level admin menu page.
	 */
	public function register_admin_menu() {
		$this->page_hook = add_menu_page(
			__( 'Validation API', 'validation-api-settings' ),
			__( 'Validation API', 'validation-api-settings' ),
			'manage_options',
			'validation-api-settings',
			array( $this, 'render_settings_page' ),
			'dashicons-yes-alt',
			80
		);
	}

	/**
	 * Render the settings page root element.
	 */
	public function render_settings_page() {
		echo '<div id="validation-api-settings-root"></div>';
	}

	/**
	 * Get a map of block type slug to human-readable title.
	 *
	 * @return array<string, string>
	 */
	private function get_block_titles() {
		$titles = array();

		foreach ( \WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
			if ( ! empty( $block_type->title ) ) {
				$titles[ $block_type->name ] = $block_type->title;
			}
		}

		return $titles;
	}

	/**
	 * Get a map of post type slug to singular label.
	 *
	 * @return array<string, string>
	 */
	private function get_post_type_labels() {
		$labels     = array();
		$post_types = get_post_types( array(), 'objects' );

		foreach ( $post_types as $post_type ) {
			$labels[ $post_type->name ] = $post_type->labels->singular_name;
		}

		return $labels;
	}

	/**
	 * Get the URL to the package directory.
	 *
	 * @return string
	 */
	private function get_package_url() {
		return plugin_dir_url( VALIDATION_API_SETTINGS_FILE );
	}

	/**
	 * Enqueue admin scripts and styles on the settings page only.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		if ( $hook_suffix !== $this->page_hook ) {
			return;
		}

		$asset_file = VALIDATION_API_SETTINGS_DIR . 'build/validation-api-settings.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset       = require $asset_file;
		$package_url = $this->get_package_url();

		wp_enqueue_script(
			'validation-api-settings',
			$package_url . 'build/validation-api-settings.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'validation-api-settings',
			$package_url . 'build/validation-api-settings.css',
			array( 'wp-components' ),
			$asset['version']
		);

		wp_localize_script(
			'validation-api-settings',
			'validationApiSettings',
			array(
				'restUrl'        => rest_url( 'wp/v2' ),
				'nonce'          => wp_create_nonce( 'wp_rest' ),
				'blockTitles'    => $this->get_block_titles(),
				'postTypeLabels' => $this->get_post_type_labels(),
			)
		);
	}
}
