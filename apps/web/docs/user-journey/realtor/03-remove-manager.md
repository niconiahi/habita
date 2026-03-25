# Realtor: Remove a manager from the agency

## The Lens

**Actor:** Real estate agency owner.

**Goal:** Remove a team member who no longer works with the agency.

**Scenario:** A manager has left the agency and needs to be removed from the platform so they no longer have access to the agency's properties.

---

## The Experience

### Phase 1: Remove Manager

**Routes:** `/admin/realtor`

**Actions:**
- Finds the manager in the team list
- Clicks the remove action
- Manager loses access to the agency

**Thoughts:**
- "What happens to their assigned properties?"
- "Will they lose access immediately?"

**Emotions:** Decisive → Done

---

## The Output

### Pain Points
- No clarity on what happens to properties the manager was responsible for
- No confirmation dialog

### Opportunities
- Show a warning about orphaned properties before removing
- Prompt to reassign properties during the removal flow
