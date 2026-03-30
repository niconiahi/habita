# /properties/[property_id]

## Loader

Parses `property_id` from params via `ForceNumberSchema`. Loads:

- `property` — via `fetch_property()`. Returns 404 if not found or if `state !== PROPERTY_STATE.PUBLISHED`.
- `has_credit_report` — checks if the authenticated user has a `USER_FILE_TYPE.CREDIT_REPORT` file via `fetch_user_files()`. Controls whether the booking button links to `/book` or `/learn/booking`.

## Auth

Public page — no auth required for viewing. Auth only checked to determine `has_credit_report`.

## Key Components

Content, Section, RoomMap (readonly), Button

## Notes

- Property images are served as base64-encoded webp inline (`data:image/webp;base64,...`)
- Rooms display type label via `display_room_type()` and dimensions as `length × width`
- Property destinies use `get_property_destiny_label()` for display
