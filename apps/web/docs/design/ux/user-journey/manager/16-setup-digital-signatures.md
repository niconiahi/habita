# Manager: Set up and send digital signatures

## The Lens

**Actor:** Property manager.

**Goal:** Get both landlord and tenant to digitally sign the contract.

**Scenario:** The contract PDF is ready. The manager needs to verify that both parties have digital certificates, start onboarding if they don't, and send the contract for signing.

---

## The Experience

### Phase 1: Check Digital Certificates

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Clicks "Check certificates" to verify if landlord and tenant have digital certificates
- Sees the status for each party

**Thoughts:**

- "Does the landlord have a certificate?"
- "Does the tenant have a certificate?"

**Emotions:** Investigating → Clear (status known)

---

### Phase 2: Start Onboarding (If Needed)

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- If either party doesn't have a certificate, starts the onboarding process for them
- The party receives a link to complete certificate registration with the external provider

**Thoughts:**

- "How long will onboarding take?"
- "Will they know what to do?"

**Emotions:** Waiting → Hoping for quick completion

---

### Phase 3: Send for Signing

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Once both parties have certificates, sends the contract for digital signing
- Both parties receive their signing links

**Thoughts:**

- "Is everything ready?"
- "Will both parties sign promptly?"

**Emotions:** Decisive → Anticipation

---

### Phase 4: Monitor Signature Status

**Routes:** `/admin/properties/[property_id]/contracts/[contract_id]/edit`

**Actions:**

- Checks signature status for landlord and tenant (pending, signed, rejected)
- Can verify signature status at any time
- Once both sign, system automatically activates the contract

**Thoughts:**

- "Has anyone signed yet?"
- "What if someone rejects?"

**Emotions:** Waiting → Ecstatic (both signed!) or Concerned (rejection)

---

## The Output

### Pain Points

- Certificate onboarding is an external dependency — can stall the process
- No notifications when a party signs — must check manually
- If someone rejects, there's no clear workflow to address concerns and re-send

### Opportunities

- Push notifications when signatures are completed
- Show a clear contract lifecycle status bar
- Add a workflow for handling rejections
