# Companion Settings Package — Implementation Checklist

## Prerequisites

- [ ] Complete core plugin additions (see [core-plugin-prerequisites.md](core-plugin-prerequisites.md))

---

## Phase 1: Companion Package Setup

### Repository and Package Structure

- [ ] Clone companion repo inside core plugin directory
- [ ] Add companion repo path to core plugin `.gitignore`
- [ ] Create companion plugin directory structure
- [ ] Create main plugin file with plugin header
- [ ] Create `composer.json` for the companion package
- [ ] Set up build tooling (webpack/wp-scripts for the DataForm JS)
- [ ] Register activation/deactivation hooks
- [ ] Add dependency check for core `validation-api` plugin

### Filter Bridge

- [ ] Register `validation_api_check_level` filter
- [ ] Implement options lookup for block scope
- [ ] Implement options lookup for meta scope
- [ ] Implement options lookup for editor scope
- [ ] Fallback to registered default when no override exists

---

## Phase 2: Companion REST API

- [ ] Create settings REST controller
  - [ ] Register route `GET /validation-api/v1/settings`
  - [ ] Register route `POST /validation-api/v1/settings`
  - [ ] Permission callback: `manage_options`
  - [ ] Sanitize and validate incoming settings on save
  - [ ] Only store overrides (not all checks)
  - [ ] Define request/response schemas

---

## Phase 3: Admin Settings Page

### PHP

- [ ] Register top-level admin menu page
- [ ] Enqueue admin scripts and styles for settings page only
- [ ] Localize script with REST API nonce and endpoint URLs
- [ ] Render root div for React mount

### JavaScript — DataForm

- [ ] Create settings app entry point
- [ ] Fetch checks from `GET /validation-api/v1/checks`
- [ ] Fetch current settings from `GET /validation-api/v1/settings`
- [ ] Merge checks with current settings to determine effective levels
- [ ] Flatten nested check data into row-per-check array for DataForm
- [ ] Build composite row IDs (e.g., `block__core/image__alt_text`)
- [ ] Configure DataForm fields:
  - [ ] Check name column (sortable, searchable)
  - [ ] Description column (searchable)
  - [ ] Scope column (sortable, filterable)
  - [ ] Plugin column (sortable)
  - [ ] Level column (editable via SeveritySelect)
- [ ] Create `SeveritySelect` custom Edit component
- [ ] Handle DataForm `onChangeItem` to track dirty state
- [ ] Implement save button that POSTs to settings endpoint
- [ ] Show success/error notices on save
- [ ] Handle loading and error states

### Styling

- [ ] Style settings page wrapper
- [ ] Style SeveritySelect component
- [ ] Ensure consistency with WordPress admin UI

---

## Phase 4: Testing and Polish

- [ ] Test filter bridge correctly overrides check levels
- [ ] Test settings save and load round-trip
- [ ] Test settings page renders with no registered checks (empty state)
- [ ] Test settings page with checks from multiple plugins
- [ ] Test settings page with unattributed checks (no plugin context)
- [ ] Test that removing an override reverts to registered default
- [ ] Test `manage_options` permission enforcement on all endpoints
- [ ] Verify DataForm sorting, searching, and filtering work correctly

---

## Future (Not v1)

- [ ] WP-CLI `wp validation-api settings` commands (list, set, reset, export, import)
- [ ] Per-plugin subpages under the top-level menu
- [ ] Bulk operations in DataForm (set all to warning, reset to defaults, disable all from plugin)
