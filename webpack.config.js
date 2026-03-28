const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const path = require( 'path' );

// Remove the default DependencyExtractionWebpackPlugin and replace it
// with one that bundles @wordpress/dataviews (not registered in WP core).
const plugins = defaultConfig.plugins.filter(
	( plugin ) =>
		plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
);

plugins.push(
	new DependencyExtractionWebpackPlugin( {
		requestToExternalModule( request ) {
			if ( request === '@wordpress/dataviews' ) {
				return undefined; // Bundle it.
			}
		},
	} )
);

module.exports = {
	...defaultConfig,
	plugins,
	entry: {
		'validation-api-settings': path.resolve(
			__dirname,
			'src/settings/index.js'
		),
	},
};
