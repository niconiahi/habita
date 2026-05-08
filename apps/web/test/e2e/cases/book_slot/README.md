# Book a Slot

## Scenario

A candidate wants to visit a rental property. A manager first creates the property, assigns a landlord, publishes it, and opens visiting time slots. The candidate then browses the public listing, navigates to the property detail page, and books an available slot by selecting a date and time

This test isolates the booking flow — the key moment where a potential tenant commits interest in a property

## Technical Details

### Preconditions

- Manager and candidate authenticated with state files
- Landlord user exists in the database with email `test-landlord@habita.test`
- Candidate has a credit report (created in global setup)

### Actors

| Role      | Auth state file            | Description                             |
| --------- | -------------------------- | --------------------------------------- |
| Manager   | `test/e2e/.auth/manager.json`   | Creates property, publishes, adds slots |
| Candidate | `test/e2e/.auth/candidate.json` | Books a visiting slot                   |

### Step-by-step Flow

1. **Creates and publishes property with slots** — Manager creates property, assigns landlord via DB, publishes, creates slot 4 days from now (18:00–19:00)
2. **Browses property and books a slot** — Candidate visits `/properties/:id`, clicks "Reservar", selects date, selects time, confirms → redirected to `/properties`

### Key Assertions

- Property page shows "Propiedad" text
- Booking link contains `/properties/:id/book`
- Date and time radio buttons are visible and selectable
- After booking, candidate is redirected to `/properties`

### Related Pages

- `/admin/properties/new` — Property creation (setup)
- `/admin/properties` — Publishing (setup)
- `/admin/properties/:id/calendar` — Slot creation (setup)
- `/properties/:id` — Public property detail
- `/properties/:id/book` — Slot booking flow
