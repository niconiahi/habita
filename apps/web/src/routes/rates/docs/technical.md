# /rates

## Loader

Requires auth + `is_webmaster()`. Returns 403 if not a webmaster. Loads:

- `rates` — from `rate` table filtered by current month/year
- `rate_types` — via `get_rate_types()`
- `current_month` / `current_year`

## Actions

- `default` — upserts a rate record. Parses `type` (via `RateTypeSchema`), `month`, `year`, `value` from form data. Uses `onConflict` on `rate_type_month_year_unique` constraint to update existing or insert new.

## Auth

Requires authenticated webmaster user.

## Notes

- Rate values are stored as strings (to support decimal precision)
- Upsert pattern: insert with `onConflict` → `doUpdateSet`
