import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { Button, Notice, Spinner, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { transformChecksToRows, rowsToSettings } from './utils/transform';
import { SeveritySelect } from './components/SeveritySelect';

const DEFAULT_VIEW = {
	type: 'table',
	search: '',
	filters: [],
	page: 1,
	perPage: 25,
	sort: { field: 'target', direction: 'asc' },
	titleField: 'target',
	descriptionField: 'description',
	fields: [ 'check_type', 'plugin_name', 'level' ],
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
					apiFetch( { path: '/wp-validation/v1/checks' } ),
					apiFetch( { path: '/validation-api-settings/v1/validation-settings' } ),
				] );
				setRows( transformChecksToRows( checks, settings ) );
			} catch ( error ) {
				setNotice( {
					status: 'error',
					message:
						error.message || __( 'Failed to load checks.', 'validation-api-settings' ),
				} );
			} finally {
				setIsLoading( false );
			}
		}
		fetchData();
	}, [] );

	useEffect( () => {
		const handler = e => {
			if ( isDirty ) {
				e.preventDefault();
			}
		};
		window.addEventListener( 'beforeunload', handler );
		return () => window.removeEventListener( 'beforeunload', handler );
	}, [ isDirty ] );

	const handleLevelChange = useCallback( ( rowId, newLevel ) => {
		setRows( prevRows =>
			prevRows.map( row => {
				if ( row.id !== rowId ) {
					return row;
				}
				return {
					...row,
					level: newLevel,
					has_override: newLevel !== row.default_level,
				};
			} )
		);
		setIsDirty( true );
	}, [] );

	const handleResetToDefault = useCallback( items => {
		const itemIds = new Set( items.map( i => i.id ) );
		setRows( prevRows =>
			prevRows.map( row =>
				itemIds.has( row.id )
					? { ...row, level: row.default_level, has_override: false }
					: row
			)
		);
		setIsDirty( true );
	}, [] );

	const handleSave = useCallback( async () => {
		setIsSaving( true );
		setNotice( null );
		try {
			const settings = rowsToSettings( rows );
			await apiFetch( {
				path: '/validation-api-settings/v1/validation-settings',
				method: 'POST',
				data: settings,
			} );
			setIsDirty( false );
			setNotice( {
				status: 'success',
				message: __( 'Settings saved successfully.', 'validation-api-settings' ),
			} );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error.message || __( 'Failed to save settings.', 'validation-api-settings' ),
			} );
		} finally {
			setIsSaving( false );
		}
	}, [ rows ] );

	const pluginElements = useMemo( () => {
		const plugins = [ ...new Set( rows.map( r => r.plugin_name ) ) ].sort();
		return plugins.map( name => ( { value: name, label: name } ) );
	}, [ rows ] );

	const fields = useMemo(
		() => [
			{
				id: 'description',
				label: __( 'Description', 'validation-api-settings' ),
				enableGlobalSearch: true,
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'target',
				label: __( 'Target', 'validation-api-settings' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'check_type',
				label: __( 'Check Type', 'validation-api-settings' ),
				enableSorting: true,
				elements: [
					{ value: 'Block', label: __( 'Block', 'validation-api-settings' ) },
					{ value: 'Meta', label: __( 'Meta', 'validation-api-settings' ) },
					{ value: 'Editor', label: __( 'Editor', 'validation-api-settings' ) },
				],
				filterBy: { isPrimary: true, operators: [ 'is' ] },
			},
			{
				id: 'plugin_name',
				label: __( 'Plugin', 'validation-api-settings' ),
				enableSorting: true,
				enableGlobalSearch: true,
				elements: pluginElements,
				filterBy: { operators: [ 'is' ] },
			},
			{
				id: 'level',
				label: __( 'Level', 'validation-api-settings' ),
				elements: [
					{ value: 'error', label: __( 'Error', 'validation-api-settings' ) },
					{ value: 'warning', label: __( 'Warning', 'validation-api-settings' ) },
					{ value: 'none', label: __( 'Disabled', 'validation-api-settings' ) },
				],
				filterBy: { isPrimary: true, operators: [ 'is' ] },
				render: ( { item } ) => (
					<SeveritySelect
						value={ item.level }
						onChange={ value => handleLevelChange( item.id, value ) }
					/>
				),
			},
		],
		[ pluginElements, handleLevelChange ]
	);

	const actions = useMemo(
		() => [
			{
				id: 'reset-to-default',
				label: __( 'Reset to default', 'validation-api-settings' ),
				isEligible: item => item.has_override,
				callback: items => handleResetToDefault( items ),
			},
		],
		[ handleResetToDefault ]
	);

	const { data: paginatedRows, paginationInfo } = useMemo(
		() => filterSortAndPaginate( rows, view, fields ),
		[ rows, view, fields ]
	);

	if ( isLoading ) {
		return (
			<div className="validation-api-settings">
				<Spinner />
				<VisuallyHidden>
					{ __( 'Loading checks…', 'validation-api-settings' ) }
				</VisuallyHidden>
			</div>
		);
	}

	return (
		<div className="validation-api-settings">
			<div className="validation-api-settings__header">
				<h1>{ __( 'Validation API Settings', 'validation-api-settings' ) }</h1>
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
					data={ paginatedRows }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					paginationInfo={ paginationInfo }
					actions={ actions }
					defaultLayouts={ { table: {} } }
				/>
			) }
		</div>
	);
}
