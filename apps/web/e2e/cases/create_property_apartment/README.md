# Create Property - Apartment

## Scenario

A manager creates a new property of type "Departamento" (apartment). Unlike houses, apartments require a unit number (e.g. "5B") to identify the specific unit within a building. The form should show the unit field when the apartment type is selected

## Technical Details

### Preconditions

- Manager user authenticated with state at `e2e/.auth/manager.json`

### Actors

| Role    | Auth state file          | Description        |
| ------- | ------------------------ | ------------------ |
| Manager | `e2e/.auth/manager.json` | Creates a property |

### Step-by-step Flow

1. **Creates an apartment property** — Manager fills location, selects type "Departamento" (0), fills unit "5B", selects destiny, submits → redirects to `/admin/properties/:id/edit`

### Key Assertions

- Unit field (`#unit`) is visible when apartment type is selected
- Property creation redirects to edit page with valid ID

### Related Pages

- `/admin/properties/new` — Property creation form
- `/admin/properties/:id/edit` — Property editing (redirect target)
