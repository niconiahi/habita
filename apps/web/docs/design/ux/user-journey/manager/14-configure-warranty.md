# Manager: Configure warranty and guarantors

## The Lens

**Actor:** Property manager.

**Goal:** Set up the warranty/guarantee for a rental contract, including income guarantors who back the rental.

**Scenario:** As part of contract configuration, the manager needs to define the warranty terms and add guarantors with their income information.

---

## The Experience

### Phase 1: Create or Update Warranty

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**
- Creates a warranty for the contract
- Fills in warranty details
- Updates warranty terms if needed

**Thoughts:**
- "What type of warranty is appropriate?"
- "Are the terms standard?"

**Emotions:** Careful → Configured

---

### Phase 2: Add Income Guarantors

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**
- Adds income guarantors who vouch for the tenant
- Fills in guarantor details and income information
- Updates or removes guarantors as needed

**Thoughts:**
- "Does this guarantor's income meet the requirements?"
- "How many guarantors do I need?"

**Emotions:** Evaluating → Secured (warranty in place)

---

## The Output

### Pain Points
- Warranty and guarantor management is on the same dense contract edit page
- No validation of guarantor income adequacy

### Opportunities
- Show recommended income-to-rent ratio
- Separate warranty configuration into its own section or tab
