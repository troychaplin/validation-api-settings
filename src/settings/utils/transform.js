const { blockTitles = {}, postTypeLabels = {} } =
	window.validationApiSettings || {};

/**
 * Flatten the nested checks REST response into a row-per-check array.
 *
 * @param {Object} checks  The response from GET /wp/v2/validation-checks.
 * @param {Object} settings The response from GET /validation-api-settings/v1/validation-settings.
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
					scope: 'block',
					block_type: blockType,
					check_name: checkName,
					description: check.description || '',
					check_type: 'Block',
					target: blockTitles[ blockType ] || blockType,
					plugin_name: check._namespace || '\u2014',
					level: override ?? check.level,
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
						scope: 'meta',
						post_type: postType,
						meta_key: metaKey,
						check_name: checkName,
						description: check.description || '',
						check_type: 'Meta',
						target: `${ metaKey } (${ postTypeLabels[ postType ] || postType })`,
						plugin_name: check._namespace || '\u2014',
						level: override ?? check.level,
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
					scope: 'editor',
					post_type: postType,
					check_name: checkName,
					description: check.description || '',
					check_type: 'Editor',
					target: postTypeLabels[ postType ] || postType,
					plugin_name: check._namespace || '\u2014',
					level: override ?? check.level,
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
 * @return {Object} Nested settings object for POST /validation-api-settings/v1/validation-settings.
 */
export function rowsToSettings( rows ) {
	const settings = {};

	for ( const row of rows ) {
		if ( ! row.has_override ) {
			continue;
		}

		switch ( row.scope ) {
			case 'block':
				if ( ! settings.block ) settings.block = {};
				if ( ! settings.block[ row.block_type ] )
					settings.block[ row.block_type ] = {};
				settings.block[ row.block_type ][ row.check_name ] = row.level;
				break;

			case 'meta':
				if ( ! settings.meta ) settings.meta = {};
				if ( ! settings.meta[ row.post_type ] )
					settings.meta[ row.post_type ] = {};
				if ( ! settings.meta[ row.post_type ][ row.meta_key ] )
					settings.meta[ row.post_type ][ row.meta_key ] = {};
				settings.meta[ row.post_type ][ row.meta_key ][ row.check_name ] =
					row.level;
				break;

			case 'editor':
				if ( ! settings.editor ) settings.editor = {};
				if ( ! settings.editor[ row.post_type ] )
					settings.editor[ row.post_type ] = {};
				settings.editor[ row.post_type ][ row.check_name ] = row.level;
				break;
		}
	}

	return settings;
}
