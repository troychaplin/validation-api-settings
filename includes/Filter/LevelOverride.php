<?php

namespace ValidationAPISettings\Filter;

class LevelOverride {

	/**
	 * Cached settings from wp_options, loaded lazily.
	 *
	 * @var array|null
	 */
	private $options;

	/**
	 * Register the filter hook.
	 */
	public function register() {
		add_filter( 'validation_api_check_level', array( $this, 'apply_override' ), 10, 2 );
	}

	/**
	 * Apply saved level overrides from wp_options.
	 *
	 * @param string $level   The current check level.
	 * @param array  $context The check context with scope-specific keys.
	 * @return string The overridden level, or the original if no override exists.
	 */
	public function apply_override( $level, $context ) {
		if ( $this->options === null ) {
			$this->options = get_option( 'validation_api_settings', array() );
		}

		$options  = $this->options;
		$scope    = $context['scope'] ?? '';
		$override = null;

		switch ( $scope ) {
			case 'block':
				$override = $options['block'][ $context['block_type'] ][ $context['check_name'] ] ?? null;
				break;

			case 'meta':
				$override = $options['meta'][ $context['post_type'] ][ $context['meta_key'] ][ $context['check_name'] ] ?? null;
				break;

			case 'editor':
				$override = $options['editor'][ $context['post_type'] ][ $context['check_name'] ] ?? null;
				break;
		}

		return $override ?? $level;
	}
}
