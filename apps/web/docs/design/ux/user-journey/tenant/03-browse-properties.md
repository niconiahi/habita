# Tenant: Browse and filter properties

## The Lens

**Actor:** Tenant — a person looking for a place to rent.

**Goal:** Explore available properties and narrow down options that match their needs.

**Scenario:** The tenant navigates to the properties listing and uses filters to find rentals that match their budget, location, and requirements.

---

## The Experience

### Phase 1: View Available Properties

**Routes:** `/properties`

**Actions:**

- Lands on the properties page
- Scrolls through property cards showing photos, location, and monthly price
- Gets a sense of what's available

**Thoughts:**

- "What's the price range in this area?"
- "Are there many options?"

**Emotions:** Curious → Exploring

---

### Phase 2: Search by Location

**Routes:** `/properties`

**Actions:**

- Types a neighborhood or zone name into the search field
- Selects a zone from the suggestions
- Clicks "Search zone" to filter results

**Thoughts:**

- "Will it find my neighborhood?"
- "How many properties are in this area?"

**Emotions:** Hopeful → Focused (results narrowed)

---

### Phase 3: Apply Filters

**Routes:** `/properties`

**Actions:**

- Toggles property tags by category (features that describe properties)
- Toggles service types (utilities included)
- Adjusts range filters: total surface area, construction year, rooms, bedrooms, bathrooms
- Each filter change submits and refreshes results

**Thoughts:**

- "I need at least 2 bedrooms"
- "I want something built recently"
- "Does this place include gas?"

**Emotions:** Analytical → Satisfied (found relevant options) or Frustrated (too few results)

---

## The Output

### Pain Points

- Each filter change submits a form and reloads the page — no real-time filtering
- No result count shown — hard to know if filters are too restrictive
- No "clear all filters" option visible

### Opportunities

- Show result count as filters are applied
- Add a "clear filters" action
- Consider client-side filtering for faster feedback
