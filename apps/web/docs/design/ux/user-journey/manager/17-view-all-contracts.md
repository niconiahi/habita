# Manager: View and filter all contracts

## The Lens

**Actor:** Property manager.

**Goal:** Get an overview of all contracts across all managed properties and filter by status.

**Scenario:** The manager wants to check the status of their contracts — which are active, which are still in draft, which have been completed.

---

## The Experience

### Phase 1: View Contracts List

**Routes:** `/admin/contracts`

**Actions:**
- Opens the contracts section in the admin dashboard
- Sees all contracts across all managed properties
- Filters by contract state (active, draft, completed, etc.)

**Thoughts:**
- "How many active contracts do I have?"
- "Are there any contracts stuck in draft?"

**Emotions:** Overview → Informed

---

### Phase 2: Change Contract State

**Routes:** `/admin/contracts`

**Actions:**
- Changes a contract's state if needed

**Thoughts:**
- "This contract should be marked as completed"

**Emotions:** Administrative → Done

---

## The Output

### Pain Points
- No summary statistics (total active, total draft, total revenue)
- Filtering is state-based only — no search by tenant name or property

### Opportunities
- Add dashboard summary cards with key metrics
- Add search by tenant or property name
