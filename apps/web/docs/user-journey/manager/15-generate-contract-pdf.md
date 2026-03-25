# Manager: Generate contract PDF

## The Lens

**Actor:** Property manager.

**Goal:** Generate a formatted PDF version of the contract for review and digital signing.

**Scenario:** The manager has configured all contract details and wants to generate the official PDF document before sending it for signatures.

---

## The Experience

### Phase 1: Generate PDF

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**
- Clicks the "Generate PDF" action
- System creates a formatted PDF from the contract data
- Reviews the generated document

**Thoughts:**
- "Does the PDF include everything?"
- "Is the formatting correct?"
- "Should I review this with the landlord first?"

**Emotions:** Anticipation → Reviewing (checking the output)

---

## The Output

### Pain Points
- No PDF preview before generation
- No ability to customize the PDF layout or branding
- If something is wrong, must edit the contract and regenerate

### Opportunities
- Add PDF preview before final generation
- Allow basic template customization
