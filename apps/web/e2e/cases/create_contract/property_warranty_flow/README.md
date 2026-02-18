# Property Warranty Flow

## Scenario

A property manager lists a rental property and creates a contract backed by a **property warranty** (garantía propietaria). This is the most traditional form of rental guarantee in Argentina — a third-party guarantor offers their own real estate as collateral. If the tenant defaults, the landlord has a legal claim against the guarantor's property.

The manager creates the property, assigns a landlord, then fills the contract with all required sections. For the warranty, they select "property" and provide the guarantor's personal details, the guarantor's property address (via location autocomplete), and cadastral data (district, section, block, parcel, and property tax ID). After generating the contract PDF, the property is published with visiting slots. A candidate books a slot and is then assigned as tenant by the manager.

## Technical Details

### Preconditions

- Three test users seeded and authenticated: manager, candidate, landlord
- Auth state files exist at `.auth/manager.json`, `.auth/candidate.json`
- Landlord user exists in the database with email `test-landlord@habita.test`
- Database accessible via `query_builder` for direct access operations

### Actors

| Role      | Auth state file          | Description                       |
| --------- | ------------------------ | --------------------------------- |
| Manager   | `.auth/manager.json`     | Creates property, contract, slots |
| Candidate | `.auth/candidate.json`   | Books a visiting slot             |
| Landlord  | (DB-only, no UI actions) | Assigned as property owner via DB |

### Step-by-step Flow

1. **Creates a property** — Manager fills location, type (DEPARTMENT), unit "4A", destiny, submits → redirects to `/admin/properties/:id/edit`
2. **Assigns landlord** — DB operation: fetches landlord user ID, calls `assign_property_access` with `ACCESS_TYPE.LANDLORD`
3. **Creates and fills contract** — Manager navigates to `/admin/properties/:id/contracts/new`, sets price $150,000, fills all contract sections, selects "property" warranty, fills guarantor details (Juan Pérez Garante, DNI 12345678), fills guarantor property address via location autocomplete, fills cadastral data (district 1, section A, block 123, parcel 456, tax ID 12345678901), generates PDF
4. **Publishes property** — Manager goes to `/admin/properties`, clicks publish for this property
5. **Creates visiting slots** — Manager navigates to `/admin/properties/:id/calendar`, creates slot for tomorrow (10:00–11:00)
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
