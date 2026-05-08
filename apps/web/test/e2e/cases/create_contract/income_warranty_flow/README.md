# Income Warranty Flow

## Scenario

A property manager lists a new rental property and sets up a contract that uses an **income-based warranty** (garantía de ingresos). This warranty type requires adding individual guarantors who vouch for the tenant's income capacity — unlike property or surety warranties, there is no single collateral asset or insurance policy backing the lease

The manager creates the property, assigns a landlord, then builds the contract filling every section (destiny, dates, escalation, CBU, fines, early termination, showroom hours, court jurisdiction, and pricing). For the warranty, they select "income", save it first, then add two guarantors with their personal details. Once the contract PDF is generated, the property is published with visiting slots. A candidate browses the listing, books a slot, and the manager finally assigns him as tenant

## Technical Details

### Preconditions

- Three test users seeded and authenticated: manager, candidate, landlord
- Auth state files exist at `test/e2e/.auth/manager.json`, `test/e2e/.auth/candidate.json`
- Landlord user exists in the database with email `test-landlord@habita.test`
- Database accessible via `query_builder` for direct access operations

### Actors

| Role      | Auth state file            | Description                       |
| --------- | -------------------------- | --------------------------------- |
| Manager   | `test/e2e/.auth/manager.json`   | Creates property, contract, slots |
| Candidate | `test/e2e/.auth/candidate.json` | Books a visiting slot             |
| Landlord  | (DB-only, no UI actions)   | Assigned as property owner via DB |

### Step-by-step Flow

1. **Creates a property** — Manager fills location, type (DEPARTMENT), unit "8C", destiny, submits → redirects to `/admin/properties/:id/edit`
2. **Assigns landlord** — DB operation: fetches landlord user ID, calls `assign_property_access` with `ACCESS_TYPE.LANDLORD`
3. **Creates and fills contract** — Manager navigates to `/admin/properties/:id/contracts/new`, sets price $180,000, fills all contract sections, selects "income" warranty, saves warranty, adds 2 guarantors (Carlos López, Ana Martínez), generates PDF
4. **Publishes property** — Manager goes to `/admin/properties`, clicks publish for this property
5. **Creates visiting slots** — Manager navigates to `/admin/properties/:id/calendar`, creates slot 3 days from now (16:00–17:00)
6. **Books a slot** — Candidate visits `/properties/:id`, clicks "Reservar", selects date then time slot, confirms booking
7. **Sets candidate as tenant** — Manager goes to `/admin/candidates`, finds property row, clicks "Asignar como inquilino"

### Key Assertions

- Property creation redirects to edit page with valid ID
- Landlord user ID is defined in the database
- Contract creation redirects to edit page with valid contract ID
- Contract edit page heading contains "contrato"
- After publishing, manager stays on `/admin/properties`
- Visiting slots table becomes visible after creation
- Property page shows "Propiedad" text for candidate
- Booking link points to `/properties/:id/book`
- After tenant assignment, page stays at `/admin/candidates`

### Related Pages

- `/admin/properties/new` — Property creation
- `/admin/properties/:id/edit` — Property editing
- `/admin/properties` — Property listing and publishing
- `/admin/properties/:id/calendar` — Visiting slot management
- `/admin/properties/:id/contracts/new` — Contract creation
- `/admin/properties/:id/contracts/:id/edit` — Contract editing (all sections + warranty)
- `/properties/:id` — Public property page
- `/properties/:id/book` — Slot booking
- `/admin/candidates` — Candidate management and tenant assignment
