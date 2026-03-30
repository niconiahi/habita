# Manager: Add services, tags, and photos to a property

## The Lens

**Actor:** Property manager.

**Goal:** Enrich the property listing with utility services, descriptive tags, construction year, and photos to make it attractive to tenants.

**Scenario:** After setting up rooms, the manager adds the remaining details that help tenants evaluate the property from the listing.

---

## The Experience

### Phase 1: Add Utility Services

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**

- Adds services like electricity, gas, water
- Sets details for each service
- Removes services that don't apply

**Thoughts:**

- "What utilities are included?"
- "Does the tenant pay for these separately?"

**Emotions:** Organized → Complete

---

### Phase 2: Toggle Feature Tags

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**

- Browses tag categories
- Toggles relevant tags on/off (features that describe the property)

**Thoughts:**

- "Which tags best describe this place?"
- "Will tenants filter by these?"

**Emotions:** Selecting → Descriptive

---

### Phase 3: Set Construction Year

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**

- Enters the year the property was built

**Thoughts:**

- "When was this built?"

**Emotions:** Quick → Done

---

### Phase 4: Upload Photos

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**

- Uploads property images
- Reviews uploaded photos

**Thoughts:**

- "Do I have good photos?"
- "Are these high enough quality?"
- "Which rooms should I photograph?"

**Emotions:** Invested (good photos matter) → Proud (property looks great)

---

## The Output

### Pain Points

- All of these are on one large page — no clear progress indicator
- No photo ordering or management (which photo shows first in the carousel?)
- Tags are toggle-based with no descriptions — may not be clear what each tag means

### Opportunities

- Add photo reordering
- Show tag descriptions on hover
- Consider a property completeness checklist
