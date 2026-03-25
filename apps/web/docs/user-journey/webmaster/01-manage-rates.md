# Webmaster: Manage rate indexes

## The Lens

**Actor:** Webmaster — a platform administrator with special access.

**Goal:** Update the monthly rate indexes that determine rental price adjustments.

**Scenario:** Each month, the webmaster updates the current rate values from official sources so contracts can calculate correct price adjustments.

---

## The Experience

### Phase 1: View Current Rates

**Routes:** `/rates`

**Actions:**
- Logs in with webmaster account
- Navigates to the rates page
- Sees current month's rates by type

**Thoughts:**
- "Which rates need updating?"
- "Have they been set this month?"

**Emotions:** Routine → Focused

---

### Phase 2: Update or Create Rates

**Routes:** `/rates`

**Actions:**
- Selects a rate type
- Enters month, year, and value
- Submits — creates or updates as needed

**Thoughts:**
- "What's the new value from the official source?"
- "Did I enter it correctly?"

**Emotions:** Careful → Done

---

## The Output

### Pain Points
- Manual one-at-a-time entry
- Only current month visible — no historical view
- No audit trail

### Opportunities
- Auto-fetch from official sources
- Historical rate view
- Audit log for changes
