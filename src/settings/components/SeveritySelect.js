import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const LEVEL_OPTIONS = [
	{ value: 'error', label: __( 'Error', 'validation-api-settings' ) },
	{ value: 'warning', label: __( 'Warning', 'validation-api-settings' ) },
	{ value: 'none', label: __( 'Disabled', 'validation-api-settings' ) },
];

export function SeveritySelect( { value, onChange } ) {
	return (
		<SelectControl
			__nextHasNoMarginBottom
			value={ value }
			options={ LEVEL_OPTIONS }
			onChange={ onChange }
		/>
	);
}
