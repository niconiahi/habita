# Manager: Set up the visit calendar

## The Lens

**Actor:** Property manager.

**Goal:** Create time slots so tenants can book visits to the property.

**Scenario:** After publishing a property, the manager sets up their availability by creating visit time slots that tenants can book.

---

## The Experience

### Phase 1: Create Time Slots

**Routes:** `/admin/properties/[property_id]/calendar`

**Actions:**

- Navigates to the property's calendar page
- Creates a new time slot by selecting a date and time range
- Repeats for multiple dates and times

**Thoughts:**

- "When am I free to show the property?"
- "How many slots should I create per day?"
- "How long should each slot be?"

**Emotions:** Planning → Organized

---

### Phase 2: Manage Existing Slots

**Routes:** `/admin/properties/[property_id]/calendar`

**Actions:**

- Reviews existing time slots
- Removes slots that are no longer available

**Thoughts:**

- "I need to cancel this slot — something came up"
- "Are any of these already booked?"

**Emotions:** Adjusting → In control

---

## The Output

### Pain Points

- No visual calendar view — slots are likely shown as a list
- Can't distinguish between free and booked slots at a glance
- No recurring slot creation (e.g., "every Tuesday 10-12")

### Opportunities

- Add a visual calendar interface
- Show booking status per slot
- Allow recurring/batch slot creation
