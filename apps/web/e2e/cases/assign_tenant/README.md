# Assign Candidate as Tenant

## Scenario

After a candidate books a visit to a property, the manager reviews the candidates list and assigns one as the tenant. This is the final step in the candidate lifecycle — the moment a potential renter officially becomes the property's tenant

The test sets up the full prerequisite chain (property creation, publishing, slot creation, candidate booking) then focuses on the assignment action from the manager's candidates page

## Technical Details

### Preconditions

- Manager and candidate authenticated with state files
- Landlord user exists in the database with email `test-landlord@habita.test`
- Candidate has a credit report (created in global setup)

### Actors

| Role      | Auth state file        | Description                      |
| --------- | ---------------------- | -------------------------------- |
| Manager   | `e2e/.auth/manager.json`   | Creates property, assigns tenant |
| Candidate | `e2e/.auth/candidate.json` | Books a slot to become candidate |

### Step-by-step Flow

1. **Creates and publishes property with slots** — Manager creates property, assigns landlord, publishes, creates slot 5 days from now
2. **Books a slot** — Candidate books the available slot on the property
3. **Assigns candidate as tenant** — Manager goes to `/admin/candidates`, finds the property row, clicks "Asignar como inquilino"

### Key Assertions

- Candidate can book a slot successfully
- After tenant assignment, manager stays at `/admin/candidates`

### Related Pages

- `/admin/properties/new` — Property creation (setup)
- `/admin/properties` — Publishing (setup)
- `/admin/properties/:id/calendar` — Slot creation (setup)
- `/properties/:id/book` — Slot booking (setup)
- `/admin/candidates` — Candidate management and tenant assignment
