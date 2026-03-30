# Create Property - House

## Scenario

A manager creates a new property of type "Casa" (house). Unlike apartment/department properties, houses don't have a unit number — there's no "4A" or "8C" since a house is a standalone building. The form should hide the unit field when the house type is selected

## Technical Details

### Preconditions

- Manager user authenticated with state at `e2e/.auth/manager.json`

### Actors

| Role    | Auth state file          | Description        |
| ------- | ------------------------ | ------------------ |
| Manager | `e2e/.auth/manager.json` | Creates a property |

### Step-by-step Flow

1. **Creates a house property** — Manager fills location, selects type "Casa" (1), verifies unit field is hidden, selects destiny, submits → redirects to `/admin/properties/:id/edit`

### Key Assertions

- Unit field (`#unit`) is not visible when house type is selected
- Property creation redirects to edit page with valid ID

### Related Pages

- `/admin/properties/new` — Property creation form
- `/admin/properties/:id/edit` — Property editing (redirect target)
