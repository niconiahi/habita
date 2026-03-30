# Tenant: Upload monthly payment receipts

## The Lens

**Actor:** Tenant — a person currently renting a property.

**Goal:** Upload proof of payment for rent and utilities each month.

**Scenario:** Each month, the tenant logs in, navigates to their contract's tenant view, and uploads receipts for the payments they've made.

---

## The Experience

### Phase 1: Access Contract View

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/tenant`

**Actions:**

- Logs into the platform
- Navigates to their contract's tenant page
- Sees the current rent price

**Thoughts:**

- "What's my rent this month?"
- "How do I get to my contract page?"

**Emotions:** Routine → Oriented

---

### Phase 2: Upload Receipts

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/tenant`

**Actions:**

- Selects receipt type (rent, electricity, gas, water, etc.)
- Selects the month (current or previous)
- Uploads the receipt file
- Sees it appear in the recent receipts list

**Thoughts:**

- "Do I have the receipt file ready?"
- "Which month does this correspond to?"

**Emotions:** Task-oriented → Done

---

### Phase 3: Review Past Receipts

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/tenant`

**Actions:**

- Scrolls through receipts from the last two months
- Downloads a receipt if needed

**Thoughts:**

- "Did I upload everything?"
- "I need last month's for my records"

**Emotions:** Calm → Confident (documented)

---

## The Output

### Pain Points

- Only 2 months of receipts are visible — no full history
- Deep navigation path to reach the tenant contract page
- No reminders to upload receipts

### Opportunities

- Full receipt history view
- Shortcut/dashboard entry point for tenants
- Monthly upload reminders
