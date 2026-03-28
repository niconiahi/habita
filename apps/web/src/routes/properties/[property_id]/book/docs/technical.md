# /properties/[property_id]/book

## Loader
Requires auth (redirects to `/auth/google`). Loads:
- `dates` — via `fetch_dates()`, groups free slots by date for the given property (`SLOT_STATE.FREE`)
- `times` — via `fetch_times()`, loads free time slots for a specific date if `?date=` param is present
- `user` — from `locals.user`

## Actions
- `SET_DATE` — receives `date` from form, validates it, and redirects to the same page with `?date=` param to show available times. Traced via OpenTelemetry.
- `UPDATE_SLOT` — receives slot `id` and `visitant_id`, reserves the slot for the user. Traced via OpenTelemetry. Redirects to parent (`..`) on success.

## Auth
Requires authenticated user.

## Key Components
Content, Section, Formulary, Button

## Notes
- Both actions are wrapped in OpenTelemetry spans for tracing
- Date selection uses radio buttons with formatted display via `display_date()`
- Time slots show start and end times in HH:MM format
