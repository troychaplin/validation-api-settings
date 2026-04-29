# Core-merge revert checklist

This plugin consumes the [Validation API](https://github.com/troychaplin/validation-api) plugin's `validation_api_check_level` filter. The Validation API plugin uses `validation_api_*` names in its standalone form for WordPress.org plugin directory compliance, but renames everything back to `wp_*` if/when it merges into Gutenberg core.

**When to use this doc:** the Validation API has merged into Gutenberg core (or the Gutenberg plugin) and is shipping under its core-style names. At that point, this companion plugin needs a one-line rename to keep working.

## What changes

The only API surface this plugin consumes from the core plugin is one filter:

| Standalone (current) | Core (target after merge) |
|---|---|
| `validation_api_check_level` | `wp_validation_check_level` |

## What to change in this plugin

### 1. The filter registration

[`includes/Filter/LevelOverride.php`](../includes/Filter/LevelOverride.php), line 18:

```diff
- add_filter( 'validation_api_check_level', array( $this, 'apply_override' ), 10, 2 );
+ add_filter( 'wp_validation_check_level', array( $this, 'apply_override' ), 10, 2 );
```

That's the only required code change.

### 2. Documentation

Find-and-replace `validation_api_check_level` → `wp_validation_check_level` across the `docs/` directory and `README.md`:

```bash
grep -rl validation_api_check_level docs/ README.md \
  | xargs sed -i '' 's/validation_api_check_level/wp_validation_check_level/g'
```

### 3. Compatibility

If you want the plugin to work with **both** the standalone Validation API plugin and the post-merge core API during a transition window, register both filters:

```php
add_filter( 'validation_api_check_level', array( $this, 'apply_override' ), 10, 2 );
add_filter( 'wp_validation_check_level', array( $this, 'apply_override' ), 10, 2 );
```

Only one will fire in any given installation (whichever filter the active validation system invokes), so duplicate registration is safe and the saved overrides apply identically.

### 4. Verify

After the rename, confirm:
- A check registered with `validation_api_register_block_check()` (now `wp_register_block_validation_check()` post-merge) shows up in the settings admin page
- Changing severity in the settings UI persists and is applied at runtime (the override flows through the renamed filter)
- No PHP notices or undefined-filter warnings in the error log

## Background

The standalone Validation API plugin originally used `wp_validation_*` naming so the names would match what core would use post-merge. WordPress.org's plugin directory disallows the `wp_*` prefix in third-party plugins (it's reserved for core), so the standalone plugin renamed to `validation_api_*` for plugin directory compliance. The original `wp_*` names are restored as a mechanical find-and-replace at core-merge time.

See the Validation API plugin's [`docs/gutenberg-alignment/core-pr-migration.md`](https://github.com/troychaplin/validation-api/blob/main/docs/gutenberg-alignment/core-pr-migration.md) for the full mapping and the upstream migration plan.
