# Tenant: Book a property visit

## The Lens

**Actor:** Tenant — a person looking for a place to rent.

**Goal:** Schedule a visit to see a property in person.

**Scenario:** The tenant found a property they like and wants to book a visit. They select an available date and time slot from the manager's schedule.

---

## The Experience

### Phase 1: Select a Date

**Routes:** `/properties/[property_id]/book`

**Actions:**

- Sees a list of available dates (days the manager set up for visits)
- Selects a date via radio button
- Clicks "Select date"
- The page reloads showing available time slots for that date

**Thoughts:**

- "Which dates work for me?"
- "There aren't many options..."
- "What if none of these work?"

**Emotions:** Hopeful → Focused (picking a date)

---

### Phase 2: Select a Time Slot

**Routes:** `/properties/[property_id]/book`

**Actions:**

- Sees available time slots for the selected date (start time – end time)
- Selects a time slot via radio button
- Clicks "Book this time slot"
- Gets redirected back to the property detail page

**Thoughts:**

- "Can I make it at this time?"
- "How long is the visit?"
- "Is my booking confirmed?"

**Emotions:** Deciding → Relieved (booking confirmed)

---

## The Output

### Pain Points

- Two-step process (date then time) requires a page reload between steps
- No confirmation message or email after booking — the tenant just gets redirected
- Can't see all time slots across all dates at once to find the best overall option

### Opportunities

- Add a booking confirmation message or email
- Consider showing a calendar view with time slots visible across dates
- Show a summary of the booking after confirmation
