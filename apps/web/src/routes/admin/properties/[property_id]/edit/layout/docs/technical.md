# /admin/properties/[property_id]/edit/layout

## Loader

No page-level loader. All data comes from parent layout (`property`).

## Actions (10 total)

Floors: `CREATE_FLOOR`, `UPDATE_FLOOR`, `DESTROY_FLOOR`, `REORDER_FLOORS`
Rooms: `CREATE_ROOM`, `UPDATE_ROOM`, `DESTROY_ROOM`, `UPDATE_ROOM_POSITIONS`
Photos: `CREATE_ROOM_FILE`, `DESTROY_ROOM_FILE`

All actions import from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

SegmentedButton, RoomMap, PhotoViewer, Formulary, Button

## Notes

- Pointer drag events for floor reordering and room positioning
- Floor number synced via URL parameter
- Photo viewer groups photos across all floors/rooms
