# Manager: Create a new property

## The Lens

**Actor:** Property manager — a person who manages rental properties (freelance or agency).

**Goal:** Register a new property on the platform so it can be enriched and eventually published.

**Scenario:** The manager wants to add a property they manage. They fill in the basic information — location, type, and intended use — to create a draft listing.

---

## The Experience

### Phase 1: Navigate to Property Creation

**Routes:** `/admin/properties` → `/admin/properties/new`

**Actions:**

- Opens the admin dashboard
- Goes to Properties section
- Clicks "New property"

**Thoughts:**

- "Where do I add a new property?"

**Emotions:** Oriented → Ready

---

### Phase 2: Set Location

**Routes:** `/admin/properties/new`

**Actions:**

- Types the property address into the location search field
- Selects the correct result from the suggestions (powered by Nominatim)

**Thoughts:**

- "Will it find my address?"
- "Is this the right match?"

**Emotions:** Hopeful → Confident (address found)

---

### Phase 3: Set Type and Destiny

**Routes:** `/admin/properties/new`

**Actions:**

- Selects the property type (apartment, house, etc.)
- If apartment, enters the unit number
- Checks the destiny boxes (residential, commercial, etc.)
- Clicks "Create property"
- Gets redirected to the edit page

**Thoughts:**

- "This is an apartment, unit 4B"
- "It's residential only"

**Emotions:** Straightforward → Accomplished (property created in draft)

---

## The Output

### Pain Points

- Only basic information is captured at creation — everything else (rooms, photos, services) happens on the edit page, so the creation feels incomplete
- Address search depends on Nominatim accuracy — some addresses may not be found

### Opportunities

- Consider combining creation + initial editing into a guided flow
- Show what steps remain after creation (rooms, photos, etc.)
