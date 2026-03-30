# Manager: Configure contract details

## The Lens

**Actor:** Property manager.

**Goal:** Fill in all the terms, conditions, and pricing for a rental contract.

**Scenario:** The manager has a draft contract and needs to configure everything: core details, pricing periods, clauses, and supporting documents.

---

## The Experience

### Phase 1: Update Core Details

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Updates the contract's core information (dates, terms, type)
- Saves changes

**Thoughts:**

- "When does the lease start and end?"
- "What terms apply?"

**Emotions:** Careful → Methodical

---

### Phase 2: Set Up Pricing Periods

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Creates pricing periods that define how rent changes over time
- Updates existing periods
- Sets the price for each period

**Thoughts:**

- "How should the rent increase over the contract duration?"
- "Are there legal requirements for price adjustment frequency?"

**Emotions:** Calculating → Precise

---

### Phase 3: Add Contract Items

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Creates individual contract clauses/items
- Attaches files to specific items if needed
- Edits or removes items

**Thoughts:**

- "Did I cover all the legal clauses?"
- "Do I need to attach any supporting documents to this clause?"

**Emotions:** Thorough → Covered

---

### Phase 4: Upload Documents

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Uploads contract-related files (scanned documents, agreements)
- Selects the document type
- Reviews uploaded files

**Thoughts:**

- "What documents need to be attached?"
- "Is the scan legible?"

**Emotions:** Administrative → Complete

---

## The Output

### Pain Points

- All configuration happens on one dense page with 18+ actions
- No progress indicator showing what's been configured vs. what's missing
- No contract templates to pre-fill common terms

### Opportunities

- Break into steps or tabs (details → pricing → clauses → documents)
- Add a completeness indicator
- Offer contract templates
