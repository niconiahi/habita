# Edit Property with Room Map

## Scenario

A manager creates a property and then edits it extensively: adding rooms with specific types and dimensions, arranging them on the visual room map by setting positions, and adding a service. The room map is a canvas-based UI where rooms are rendered as colored rectangles that can be dragged to arrange the floor plan. Positions are saved as JSON coordinates

This test covers the full property editing workflow beyond the initial creation — the kind of detailed configuration a manager does before publishing a listing

## Technical Details

### Preconditions

- Manager user authenticated with state at `.auth/manager.json`

### Actors

| Role    | Auth state file      | Description                              |
| ------- | -------------------- | ---------------------------------------- |
| Manager | `.auth/manager.json` | Creates and edits property configuration |

### Step-by-step Flow

1. **Creates a property** — Manager creates a DEPARTMENT property with unit "7D" → redirects to edit page
2. **Adds rooms** — Clicks "Agregar ambiente" 4 times to create 4 rooms
3. **Configures rooms** — Sets each room type (bedroom, bathroom, kitchen, living) and dimensions (length/width), saves each individually
4. **Moves rooms on map** — Sets room positions via the hidden positions input using valid coordinates from the issue spec, submits "Guardar mapa"
5. **Adds a service** — Clicks "Agregar servicio", configures as ABL (municipal fee) with code 123456, saves

### Key Assertions

- 4 room type selects exist after adding rooms
- Edit page stays at `/admin/properties/:id/edit` after each save (no errors)

### Related Pages

- `/admin/properties/new` — Property creation
- `/admin/properties/:id/edit` — Property editing (rooms, map, services, photos, members)
