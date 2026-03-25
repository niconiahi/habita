# Manager: Unpublish a property

## The Lens

**Actor:** Property manager.

**Goal:** Remove a property from the public listing, taking it back to editing state.

**Scenario:** The manager needs to take a property offline — maybe to update it, or because it's no longer available for rent.

---

## The Experience

### Phase 1: Unpublish

**Routes:** `/admin/properties`

**Actions:**
- Goes to the properties list
- Finds the published property
- Clicks "Unpublish"
- Property state changes to "Editing"
- The property disappears from the public listing

**Thoughts:**
- "I need to update this before more people see it"
- "What happens to existing bookings?"

**Emotions:** Decisive → Resolved

---

## The Output

### Pain Points
- No clarity on what happens to existing visit bookings when a property is unpublished
- No confirmation dialog before unpublishing

### Opportunities
- Show a warning if there are pending visit bookings
- Add a confirmation step
