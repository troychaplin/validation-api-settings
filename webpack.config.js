const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		'validation-api-settings': path.resolve(
			__dirname,
			'src/settings/index.js'
		),
	},
};
