import { createRoot } from '@wordpress/element';
import { App } from './App';

import './styles.scss';

const root = document.getElementById( 'validation-api-settings-root' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
