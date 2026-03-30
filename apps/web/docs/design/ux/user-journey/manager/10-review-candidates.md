# Manager: Review candidates

## The Lens

**Actor:** Property manager.

**Goal:** Review the profiles of people who booked visits to their properties.

**Scenario:** Tenants have booked visits to the manager's properties. The manager wants to review each candidate's personal information and documents to evaluate them.

---

## The Experience

### Phase 1: See Candidates List

**Routes:** `/admin/candidates` or `/admin/properties/[property_id]/candidates`

**Actions:**

- Views the global candidates list across all properties
- Or views candidates for a specific property
- Sees names, dates, and property associations

**Thoughts:**

- "Who's interested in my properties?"
- "How many candidates does each property have?"

**Emotions:** Anticipation → Engaged

---

### Phase 2: Review Individual Profile

**Routes:** `/admin/candidates/[candidate_id]`

**Actions:**

- Clicks into a candidate's profile
- Reviews personal information and uploaded documents
- Evaluates whether they're a good fit

**Thoughts:**

- "Are their documents complete?"
- "Can they afford the rent?"
- "Do they seem reliable?"

**Emotions:** Analytical → Decided (good fit or not)

---

## The Output

### Pain Points

- No comparison view between candidates
- Profile completeness depends on what the tenant uploaded
- No notes or rating system for candidates

### Opportunities

- Add side-by-side candidate comparison
- Show profile completeness indicator
- Allow managers to add private notes about candidates
