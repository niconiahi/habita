# Landlord: Accept a property invitation

## The Lens

**Actor:** Landlord — a property owner who doesn't manage the property themselves.

**Goal:** Accept the invitation to access their property on the platform.

**Scenario:** A property manager invited the landlord via email. The landlord clicks the link to gain access to their property.

---

## The Experience

### Phase 1: Receive Email

**Actions (off-platform):**
- Receives an email with an invitation link
- May or may not know what Habita is

**Thoughts:**
- "What is this?"
- "Is this legitimate?"
- "Do I need to create an account?"

**Emotions:** Confused → Cautious

---

### Phase 2: Create Account (If Needed)

**Routes:** `/signup` or `/login`

**Actions:**
- If no account: signs up with the same email used in the invitation
- If has account: logs in

**Thoughts:**
- "I need to use the same email the invitation was sent to"

**Emotions:** Navigating → Proceeding

---

### Phase 3: Accept Invitation

**Routes:** `/properties/[property_id]/accept-invite`

**Actions:**
- Clicks the invitation link
- System verifies: token not expired, not used, email matches
- Gets granted landlord access to the property
- Redirected to the property detail page

**Thoughts:**
- "Did it work?"
- "What can I see now?"

**Emotions:** Uncertain → Oriented (seeing their property on the platform)

---

## The Output

### Pain Points
- Cold start — landlords may have never heard of the platform
- Email matching is strict (including subaddress handling) — could fail silently
- No post-acceptance onboarding explaining what a landlord can do

### Opportunities
- Add a welcome/onboarding step after accepting the invitation
- Improve the invitation email with clear context about what Habita is
