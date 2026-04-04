import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	Button,
	Card,
	CardBody,
	Spinner,
	Notice,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { transformChecksToRows, rowsToSettings } from './utils/transform';
import { SeveritySelect } from './components/SeveritySelect';

const SORTABLE_COLUMNS = [ 'target', 'check_type', 'plugin_name', 'level' ];

const COLUMNS = [
	{ key: 'description', label: __( 'Description', 'validation-api-settings' ) },
	{ key: 'target', label: __( 'Target', 'validation-api-settings' ) },
	{ key: 'check_type', label: __( 'Check Type', 'validation-api-settings' ) },
	{ key: 'plugin_name', label: __( 'Plugin', 'validation-api-settings' ) },
	{ key: 'level', label: __( 'Level', 'validation-api-settings' ) },
];

export function App() {
	const [ rows, setRows ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ notice, setNotice ] = useState( null );
	const [ sortConfig, setSortConfig ] = useState( {
		key: 'target',
		direction: 'asc',
	} );

	useEffect( () => {
		async function fetchData() {
			try {
				const [ checks, settings ] = await Promise.all( [
					apiFetch( { path: '/wp/v2/validation-checks' } ),
					apiFetch( { path: '/validation-api-settings/v1/validation-settings' } ),
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

	useEffect( () => {
		const handler = ( e ) => {
			if ( isDirty ) {
				e.preventDefault();
			}
		};
		window.addEventListener( 'beforeunload', handler );
		return () => window.removeEventListener( 'beforeunload', handler );
	}, [ isDirty ] );

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
				path: '/validation-api-settings/v1/validation-settings',
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

	const handleSort = useCallback( ( key ) => {
		if ( ! SORTABLE_COLUMNS.includes( key ) ) {
			return;
		}

		setSortConfig( ( prev ) => ( {
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
		} ) );
	}, [] );

	const sortedRows = useMemo( () => {
		const { key, direction } = sortConfig;

		return [ ...rows ].sort( ( a, b ) => {
			const aVal = ( a[ key ] || '' ).toLowerCase();
			const bVal = ( b[ key ] || '' ).toLowerCase();

			if ( aVal < bVal ) return direction === 'asc' ? -1 : 1;
			if ( aVal > bVal ) return direction === 'asc' ? 1 : -1;
			return 0;
		} );
	}, [ rows, sortConfig ] );

	if ( isLoading ) {
		return (
			<div className="validation-api-settings">
				<Spinner />
				<VisuallyHidden>
					{ __( 'Loading checks\u2026', 'validation-api-settings' ) }
				</VisuallyHidden>
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
				<CardBody>
					{ rows.length === 0 ? (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'No validation checks are registered. Activate plugins that register checks with the Validation API.',
								'validation-api-settings'
							) }
						</Notice>
					) : (
						<div className="validation-api-settings__table-wrap">
							<table className="validation-api-settings__table">
								<thead>
									<tr>
										{ COLUMNS.map( ( col ) => {
											const isSortable = SORTABLE_COLUMNS.includes( col.key );
											const isSorted = sortConfig.key === col.key;

											return (
												<th
													key={ col.key }
													aria-sort={
														isSorted
															? sortConfig.direction === 'asc'
																? 'ascending'
																: 'descending'
															: undefined
													}
												>
													{ isSortable ? (
														<button
															className="validation-api-settings__sort-button"
															onClick={ () => handleSort( col.key ) }
															type="button"
														>
															{ col.label }
															{ isSorted && (
																<span className="sort-indicator" aria-hidden="true">
																	{ sortConfig.direction === 'asc' ? ' \u25B2' : ' \u25BC' }
																</span>
															) }
														</button>
													) : (
														col.label
													) }
												</th>
											);
										} ) }
									</tr>
								</thead>
								<tbody>
									{ sortedRows.map( ( row ) => (
										<tr key={ row.id }>
											<td>{ row.description }</td>
											<td>{ row.target }</td>
											<td>{ row.check_type }</td>
											<td>{ row.plugin_name }</td>
											<td>
												<SeveritySelect
													value={ row.level }
													onChange={ ( value ) =>
														handleLevelChange( row.id, value )
													}
												/>
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					) }
				</CardBody>
			</Card>
		</div>
	);
}
