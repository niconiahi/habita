# Manager: Create a contract

## The Lens

**Actor:** Property manager.

**Goal:** Create a new rental contract for a property.

**Scenario:** After selecting a tenant, the manager creates a contract by choosing the contract type. The contract starts in draft state and needs to be configured further.

---

## The Experience

### Phase 1: Start Contract Creation

**Routes:** `/admin/properties/[property_id]/contracts/new` or `/admin/contracts/new`

**Actions:**

- Either navigates directly from a specific property, or goes through the global contracts page and selects a property first
- Selects the contract type
- Submits the form
- Gets redirected to the contract editing page

**Thoughts:**

- "What type of contract is this?"
- "Is the right property selected?"

**Emotions:** Focused → Clear (contract created, editing begins)

---

## The Output

### Pain Points

- Two entry points (property-specific vs. global) can be confusing
- Contract type selection is the only thing captured at creation — feels minimal

### Opportunities

- Unify contract creation to one clear path
