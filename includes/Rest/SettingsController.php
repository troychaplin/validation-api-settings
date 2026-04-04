<?php

namespace ValidationAPISettings\Rest;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

class SettingsController extends WP_REST_Controller {

	/**
	 * The REST namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wp/v2';

	/**
	 * The REST base.
	 *
	 * @var string
	 */
	protected $rest_base = 'validation-settings';

	/**
	 * The option key for storing settings.
	 *
	 * @var string
	 */
	const OPTION_KEY = 'validation_api_settings';

	/**
	 * Valid level values.
	 *
	 * @var array
	 */
	const VALID_LEVELS = array( 'error', 'warning', 'none' );

	/**
	 * Register REST routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_items' ),
					'permission_callback' => array( $this, 'update_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Permission check for reading settings.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to view settings.', 'validation-api-settings' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Permission check for updating settings.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool|WP_Error
	 */
	public function update_items_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to update settings.', 'validation-api-settings' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Get current settings.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$settings = get_option( self::OPTION_KEY, array() );

		return new WP_REST_Response( $settings, 200 );
	}

	/**
	 * Update settings.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_items( $request ) {
		$settings = $request->get_json_params();

		if ( ! is_array( $settings ) ) {
			return new WP_Error(
				'invalid_settings',
				__( 'Settings must be a JSON object.', 'validation-api-settings' ),
				array( 'status' => 400 )
			);
		}

		$sanitized = $this->sanitize_settings( $settings );

		update_option( self::OPTION_KEY, $sanitized );

		return new WP_REST_Response( $sanitized, 200 );
	}

	/**
	 * Sanitize and validate settings, keeping only valid scope keys and level values.
	 *
	 * @param array $settings Raw settings input.
	 * @return array Sanitized settings.
	 */
	private function sanitize_settings( $settings ) {
		$sanitized = array();

		if ( isset( $settings['block'] ) && is_array( $settings['block'] ) ) {
			foreach ( $settings['block'] as $block_type => $checks ) {
				if ( ! is_array( $checks ) ) {
					continue;
				}
				foreach ( $checks as $check_name => $level ) {
					if ( in_array( $level, self::VALID_LEVELS, true ) ) {
						$sanitized['block'][ sanitize_text_field( $block_type ) ][ sanitize_text_field( $check_name ) ] = $level;
					}
				}
			}
		}

		if ( isset( $settings['meta'] ) && is_array( $settings['meta'] ) ) {
			foreach ( $settings['meta'] as $post_type => $meta_keys ) {
				if ( ! is_array( $meta_keys ) ) {
					continue;
				}
				foreach ( $meta_keys as $meta_key => $checks ) {
					if ( ! is_array( $checks ) ) {
						continue;
					}
					foreach ( $checks as $check_name => $level ) {
						if ( in_array( $level, self::VALID_LEVELS, true ) ) {
							$sanitized['meta'][ sanitize_text_field( $post_type ) ][ sanitize_text_field( $meta_key ) ][ sanitize_text_field( $check_name ) ] = $level;
						}
					}
				}
			}
		}

		if ( isset( $settings['editor'] ) && is_array( $settings['editor'] ) ) {
			foreach ( $settings['editor'] as $post_type => $checks ) {
				if ( ! is_array( $checks ) ) {
					continue;
				}
				foreach ( $checks as $check_name => $level ) {
					if ( in_array( $level, self::VALID_LEVELS, true ) ) {
						$sanitized['editor'][ sanitize_text_field( $post_type ) ][ sanitize_text_field( $check_name ) ] = $level;
					}
				}
			}
		}

		return $sanitized;
	}
}
