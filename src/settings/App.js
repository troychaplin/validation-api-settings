import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Spinner,
	Notice,
	SelectControl,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews/wp';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { transformChecksToRows, rowsToSettings } from './utils/transform';

const LEVEL_OPTIONS = [
	{ value: 'error', label: __( 'Error', 'validation-api-settings' ) },
	{ value: 'warning', label: __( 'Warning', 'validation-api-settings' ) },
	{ value: 'none', label: __( 'Disabled', 'validation-api-settings' ) },
];

const DEFAULT_VIEW = {
	type: 'table',
	perPage: 25,
	layout: {},
	fields: [
		'check_name',
		'description',
		'scope_label',
		'plugin_name',
		'level',
	],
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

	const handleLevelChange = useCallback( ( rowId, newLevel ) => {
		setRows( ( prevRows ) =>
			prevRows.map( ( row ) => {
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

	const fields = useMemo(
		() => [
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
				render: ( { item } ) => (
					<SelectControl
						__nextHasNoMarginBottom
						value={ item.level }
						options={ LEVEL_OPTIONS }
						onChange={ ( value ) =>
							handleLevelChange( item.id, value )
						}
					/>
				),
				elements: LEVEL_OPTIONS,
			},
		],
		[ handleLevelChange ]
	);

	const { data: visibleData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( rows, view, fields );
	}, [ rows, view, fields ] );

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
					{ __(
						'Validation API Settings',
						'validation-api-settings'
					) }
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

			<Card>
				{/* <CardHeader>
					<h2>
						{ __(
							'Registered Checks',
							'validation-api-settings'
						) }
					</h2>
                    <p>{ __( 'Manage the validation settings for your site.', 'validation-api-settings' ) }</p>
				</CardHeader> */}
				<CardBody>
					{ rows.length === 0 ? (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'No validation checks are registered. Activate plugins that register checks with the Validation API.',
								'validation-api-settings'
							) }
						</Notice>
					) : (
						<DataViews
							data={ visibleData }
							fields={ fields }
							view={ view }
							onChangeView={ setView }
							paginationInfo={ paginationInfo }
							getItemId={ ( item ) => item.id }
						/>
					) }
				</CardBody>
			</Card>
		</div>
	);
}
