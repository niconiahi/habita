# Empty Contract - Validation Errors

## Scenario

A manager creates a new contract but attempts to generate the PDF without filling in any of the required sections. The system should display validation errors for all missing fields — dates, escalation, fine percentage, tenant info, landlord info, and property data. This is a negative-path test that verifies the form validation catches all missing data before allowing PDF generation

## Technical Details

### Preconditions

- Manager user authenticated with state at `e2e/.auth/manager.json`

### Actors

| Role    | Auth state file      | Description                         |
| ------- | -------------------- | ----------------------------------- |
| Manager | `e2e/.auth/manager.json` | Creates property and empty contract |

### Step-by-step Flow

1. **Creates property and empty contract** — Manager creates a DEPARTMENT property, then creates a contract with only the initial price filled ($100,000)
2. **Generates PDF and sees errors** — Clicks "Generar contrato" without filling any sections → validation errors appear for missing landlord, tenant, dates, escalation, etc.

### Key Assertions

- An error shows in each field after attempting PDF generation
- "Sin propietario asignado" message is visible (no landlord)
- "Sin inquilino asignado" message is visible (no tenant)

### Related Pages

- `/admin/properties/new` — Property creation (setup)
- `/admin/properties/:id/contracts/new` — Contract creation
- `/admin/properties/:id/contracts/:id/edit` — Contract editing with validation errors
