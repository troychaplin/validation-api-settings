import { useState, useEffect, useCallback } from '@wordpress/element';
import { Button, Spinner, Notice } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { SeveritySelect } from './components/SeveritySelect';
import { transformChecksToRows, rowsToSettings } from './utils/transform';

const FIELDS = [
	{
		id: 'check_name',
		label: __( 'Check', 'validation-api-settings' ),
		enableGlobalSearch: true,
		enableSorting: true,
	},
	{
		id: 'description',
		label: __( 'Description', 'validation-api-settings' ),
		enableGlobalSearch: true,
	},
	{
		id: 'scope_label',
		label: __( 'Scope', 'validation-api-settings' ),
		enableSorting: true,
	},
	{
		id: 'plugin_name',
		label: __( 'Plugin', 'validation-api-settings' ),
		enableSorting: true,
	},
	{
		id: 'level',
		label: __( 'Level', 'validation-api-settings' ),
		Edit: SeveritySelect,
		elements: [
			{
				value: 'error',
				label: __( 'Error', 'validation-api-settings' ),
			},
			{
				value: 'warning',
				label: __( 'Warning', 'validation-api-settings' ),
			},
			{
				value: 'none',
				label: __( 'Disabled', 'validation-api-settings' ),
			},
		],
	},
];

const DEFAULT_VIEW = {
	type: 'table',
	perPage: 25,
	layout: {},
	fields: [ 'check_name', 'description', 'scope_label', 'plugin_name', 'level' ],
};

export function App() {
	const [ rows, setRows ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ notice, setNotice ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	useEffect( () => {
		async function fetchData() {
			try {
				const [ checks, settings ] = await Promise.all( [
					apiFetch( { path: '/validation-api/v1/checks' } ),
					apiFetch( { path: '/validation-api/v1/settings' } ),
				] );

				setRows( transformChecksToRows( checks, settings ) );
			} catch ( error ) {
				setNotice( {
					status: 'error',
					message:
						error.message ||
						__(
							'Failed to load checks.',
							'validation-api-settings'
						),
				} );
			} finally {
				setIsLoading( false );
			}
		}

		fetchData();
	}, [] );

	const onChangeField = useCallback( ( updatedItems ) => {
		setRows( ( prevRows ) =>
			prevRows.map( ( row ) => {
				const updated = updatedItems.find(
					( item ) => item.id === row.id
				);

				if ( ! updated ) {
					return row;
				}

				const newLevel = updated.level;
				const hasOverride = newLevel !== row.default_level;

				return {
					...row,
					level: newLevel,
					has_override: hasOverride,
				};
			} )
		);
		setIsDirty( true );
	}, [] );

	const handleSave = useCallback( async () => {
		setIsSaving( true );
		setNotice( null );

		try {
			const settings = rowsToSettings( rows );

			await apiFetch( {
				path: '/validation-api/v1/settings',
				method: 'POST',
				data: settings,
			} );

			setIsDirty( false );
			setNotice( {
				status: 'success',
				message: __(
					'Settings saved successfully.',
					'validation-api-settings'
				),
			} );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error.message ||
					__(
						'Failed to save settings.',
						'validation-api-settings'
					),
			} );
		} finally {
			setIsSaving( false );
		}
	}, [ rows ] );

	if ( isLoading ) {
		return (
			<div className="validation-api-settings">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="validation-api-settings">
			<div className="validation-api-settings__header">
				<h1>
					{ __( 'Validation API Settings', 'validation-api-settings' ) }
				</h1>
				<Button
					variant="primary"
					onClick={ handleSave }
					isBusy={ isSaving }
					disabled={ ! isDirty || isSaving }
				>
					{ __( 'Save Changes', 'validation-api-settings' ) }
				</Button>
			</div>

			{ notice && (
				<Notice
					status={ notice.status }
					isDismissible
					onDismiss={ () => setNotice( null ) }
				>
					{ notice.message }
				</Notice>
			) }

			{ rows.length === 0 ? (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'No validation checks are registered. Activate plugins that register checks with the Validation API.',
						'validation-api-settings'
					) }
				</Notice>
			) : (
				<DataViews
					data={ rows }
					fields={ FIELDS }
					view={ view }
					onChangeView={ setView }
					onChangeField={ onChangeField }
					getItemId={ ( item ) => item.id }
				/>
			) }
		</div>
	);
}
