const { blockTitles = {}, postTypeLabels = {} } =
	window.validationApiSettings || {};

/**
 * Flatten the nested checks REST response into a row-per-check array.
 *
 * @param {Object} checks  The response from GET /wp/v2/checks.
 * @param {Object} settings The response from GET /wp/v2/settings.
 * @return {Array} Flat array of row objects.
 */
export function transformChecksToRows( checks, settings ) {
	const rows = [];

	// Block checks: checks.block[blockType][checkName]
	if ( checks.block ) {
		for ( const [ blockType, blockChecks ] of Object.entries(
			checks.block
		) ) {
			for ( const [ checkName, check ] of Object.entries(
				blockChecks
			) ) {
				if ( check.configurable === false ) {
					continue;
				}

				const override =
					settings?.block?.[ blockType ]?.[ checkName ] ?? null;

				rows.push( {
					id: `block__${ blockType }__${ checkName }`,
					check_name: checkName,
					description: check.description || '',
					scope: 'block',
					check_type: 'Block',
					target: blockTitles[ blockType ] || blockType,
					plugin_name: check._namespace || '\u2014',
					level: override || check.level,
					default_level: check.level,
					has_override: override !== null,
				} );
			}
		}
	}

	// Meta checks: checks.meta[postType][metaKey][checkName]
	if ( checks.meta ) {
		for ( const [ postType, metaKeys ] of Object.entries( checks.meta ) ) {
			for ( const [ metaKey, metaChecks ] of Object.entries(
				metaKeys
			) ) {
				for ( const [ checkName, check ] of Object.entries(
					metaChecks
				) ) {
					if ( check.configurable === false ) {
						continue;
					}

					const override =
						settings?.meta?.[ postType ]?.[ metaKey ]?.[
							checkName
						] ?? null;

					rows.push( {
						id: `meta__${ postType }__${ metaKey }__${ checkName }`,
						check_name: checkName,
						description: check.description || '',
						scope: 'meta',
						check_type: 'Meta',
						target: `${ metaKey } (${ postTypeLabels[ postType ] || postType })`,
						plugin_name: check._namespace || '\u2014',
						level: override || check.level,
						default_level: check.level,
						has_override: override !== null,
					} );
				}
			}
		}
	}

	// Editor checks: checks.editor[postType][checkName]
	if ( checks.editor ) {
		for ( const [ postType, editorChecks ] of Object.entries(
			checks.editor
		) ) {
			for ( const [ checkName, check ] of Object.entries(
				editorChecks
			) ) {
				if ( check.configurable === false ) {
					continue;
				}

				const override =
					settings?.editor?.[ postType ]?.[ checkName ] ?? null;

				rows.push( {
					id: `editor__${ postType }__${ checkName }`,
					check_name: checkName,
					description: check.description || '',
					scope: 'editor',
					check_type: 'Editor',
					target: postTypeLabels[ postType ] || postType,
					plugin_name: check._namespace || '\u2014',
					level: override || check.level,
					default_level: check.level,
					has_override: override !== null,
				} );
			}
		}
	}

	return rows;
}

/**
 * Convert a flat row back into the nested settings structure for saving.
 * Only includes rows that have been overridden.
 *
 * @param {Array} rows The flat array of row objects.
 * @return {Object} Nested settings object for POST /wp/v2/settings.
 */
export function rowsToSettings( rows ) {
	const settings = {};

	for ( const row of rows ) {
		if ( ! row.has_override ) {
			continue;
		}

		const parts = row.id.split( '__' );

		switch ( parts[ 0 ] ) {
			case 'block':
				if ( ! settings.block ) settings.block = {};
				if ( ! settings.block[ parts[ 1 ] ] )
					settings.block[ parts[ 1 ] ] = {};
				settings.block[ parts[ 1 ] ][ parts[ 2 ] ] = row.level;
				break;

			case 'meta':
				if ( ! settings.meta ) settings.meta = {};
				if ( ! settings.meta[ parts[ 1 ] ] )
					settings.meta[ parts[ 1 ] ] = {};
				if ( ! settings.meta[ parts[ 1 ] ][ parts[ 2 ] ] )
					settings.meta[ parts[ 1 ] ][ parts[ 2 ] ] = {};
				settings.meta[ parts[ 1 ] ][ parts[ 2 ] ][ parts[ 3 ] ] =
					row.level;
				break;

			case 'editor':
				if ( ! settings.editor ) settings.editor = {};
				if ( ! settings.editor[ parts[ 1 ] ] )
					settings.editor[ parts[ 1 ] ] = {};
				settings.editor[ parts[ 1 ] ][ parts[ 2 ] ] = row.level;
				break;
		}
	}

	return settings;
}
