# Landlord: Sign a rental contract

## The Lens

**Actor:** Landlord — a property owner.

**Goal:** Digitally sign the rental contract for their property.

**Scenario:** The property manager created a contract and sent it for signing. The landlord needs to review and sign it.

---

## The Experience

### Phase 1: See Pending Signature

**Routes:** `/signatures`

**Actions:**

- Navigates to the signatures page
- Sees the contract requiring their signature
- Sees the property address and signature statuses

**Thoughts:**

- "There's a contract waiting for me"
- "Has the tenant signed yet?"

**Emotions:** Alert → Engaged

---

### Phase 2: Complete Digital Signature

**Routes:** `/signatures` → external provider → `/digital_signature/success` or `/digital_signature/rejected` or `/digital_signature/error`

**Actions:**

- Clicks the signing link
- Gets redirected to Alpha2000 Firmador
- Completes or rejects the signature
- Returns to the result page

**Thoughts:**

- "Is this legally binding?"
- "I'm leaving the platform — is this safe?"
- "What if I need to reject and ask for changes?"

**Emotions:** Careful → Relieved (signed) or Concerned (needs changes)

---

## The Output

### Pain Points

- No dedicated contract review page for landlords before signing
- External signing flow may be unfamiliar
- No way to request changes — only sign or reject

### Opportunities

- Add a contract review page for landlords with full details
- Add a "request changes" flow before signing
- Add guidance text before the external redirect
