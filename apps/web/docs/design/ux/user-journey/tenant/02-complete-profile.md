# Tenant: Complete profile and upload documents

## The Lens

**Actor:** Tenant — a person looking for a place to rent.

**Goal:** Fill in all personal information and upload the documents required to book visits and sign contracts.

**Scenario:** After onboarding, the tenant lands on their profile page and needs to provide personal details and documents before they can take meaningful action on the platform.

---

## The Experience

### Phase 1: Fill Personal Information

**Routes:** `/profile`

**Actions:**

- Fills in name and surname (may already be pre-filled from signup)
- Adds phone number (specific format required)
- Enters national ID number (documento)
- Enters CUIL number
- Clicks "Save"

**Thoughts:**

- "What format does the phone number need?"
- "Why do they need my documento and CUIL?"
- "Is this information encrypted?"

**Emotions:** Slightly annoyed (lots of fields) → Reassured (help article link available)

---

### Phase 2: Learn About Requirements

**Routes:** `/learn/user-information`, `/learn/phone-number`

**Actions:**

- Clicks "Learn more" links next to fields
- Reads help articles explaining what's needed and why
- Returns to the profile page to continue

**Thoughts:**

- "Oh, the phone number needs the country code"
- "Now I understand why they need the CUIL"

**Emotions:** Confused → Informed

---

### Phase 3: Upload Documents

**Routes:** `/profile`

**Actions:**

- Clicks "Add document"
- Selects the document type (ID card, proof of income, credit report, etc.)
- Uploads the file
- Sees the document appear in the table
- Repeats for each required document

**Thoughts:**

- "Do I have my credit report ready?"
- "What file formats are accepted?"
- "Did the upload work?"

**Emotions:** Effort (gathering documents) → Accomplished (documents uploaded)

---

## The Output

### Pain Points

- No clear indication of which documents are required vs. optional
- The credit report is required to book visits, but this isn't surfaced until the tenant tries to book
- Phone number format requirements only become clear after a validation error or by reading the help article

### Opportunities

- Show a checklist of required documents with completion status
- Surface the credit report requirement prominently during profile setup
- Show phone format example inline (not just via help article)
