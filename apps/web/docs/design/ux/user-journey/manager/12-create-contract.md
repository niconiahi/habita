# Manager: Create a contract

## The Lens

**Actor:** Property manager.

**Goal:** Create a new rental contract for a property.

**Scenario:** After selecting a tenant, the manager creates a contract by choosing the contract type. The contract starts in draft state and needs to be configured further.

---

## The Experience

### Phase 1: Start Contract Creation

**Routes:** `/admin/properties/[property_id]/contracts/new`

**Actions:**

- Navigates to the property's contracts tab and clicks "Nuevo contrato"
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

- Contract type selection is the only thing captured at creation — feels minimal
