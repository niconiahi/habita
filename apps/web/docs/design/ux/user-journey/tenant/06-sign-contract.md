# Tenant: Sign a rental contract

## The Lens

**Actor:** Tenant — a person who has been accepted as the tenant for a property.

**Goal:** Review and digitally sign the rental contract.

**Scenario:** The property manager created a contract and sent it for signing. The tenant needs to complete their digital signature to activate the contract.

---

## The Experience

### Phase 1: See Pending Signature

**Routes:** `/signatures`

**Actions:**
- Navigates to the signatures page
- Sees a list of contracts requiring their signature
- Each entry shows the property address and signature status (pending/signed) for both landlord and tenant

**Thoughts:**
- "There's a contract waiting for me"
- "Has the landlord signed already?"

**Emotions:** Alert → Engaged

---

### Phase 2: Complete Digital Signature

**Routes:** `/signatures` → external provider → `/digital_signature/success` or `/digital_signature/rejected` or `/digital_signature/error`

**Actions:**
- Clicks the signing link for their contract
- Gets redirected to the Alpha2000 Firmador external provider
- Completes the digital signature process
- Returns to the platform on the result page

**Thoughts:**
- "I'm leaving the platform — is this safe?"
- "How do I sign digitally?"
- "Did it work?"

**Emotions:** Nervous (external redirect) → Relieved (signed) or Frustrated (error/rejection)

---

### Phase 3: Contract Activated

**Routes:** Automatic — no tenant action needed

**Actions:**
- Once both landlord and tenant have signed, the system automatically downloads the signed PDF and activates the contract
- The tenant can now access their contract's tenant view to upload receipts

**Thoughts:**
- "Is the contract official now?"
- "Where can I see the signed document?"

**Emotions:** Accomplished → Ready (tenancy begins)

---

## The Output

### Pain Points
- Digital certificate onboarding may be required before signing — if the tenant doesn't have a certificate, the process stalls
- The external signature provider may be unfamiliar and confusing
- No in-app notification when the contract is fully activated

### Opportunities
- Prompt tenants to complete digital certificate onboarding as part of profile setup
- Add contextual explanation before the external redirect
- Notify the tenant when the contract is fully signed and active
