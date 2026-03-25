# Manager: Invite a landlord to a property

## The Lens

**Actor:** Property manager.

**Goal:** Give the property owner (landlord) access to their property on the platform so they can view information and sign contracts.

**Scenario:** The manager is setting up a property and wants to invite the actual owner — who might not be on the platform yet — so they can be part of the contract signing process later.

---

## The Experience

### Phase 1: Send Invitation

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**
- Finds the "Invite landlord" section on the edit page
- Enters the landlord's email address
- Submits the invitation
- System sends an email with an invitation link

**Thoughts:**
- "What email should I use for the landlord?"
- "Will they know what to do when they get the email?"

**Emotions:** Practical → Hopeful (invitation sent)

---

## The Output

### Pain Points
- No visibility into whether the landlord received or opened the invitation
- The landlord experience after clicking the link is their own journey (see landlord journeys)
- Can't resend or cancel invitations from the UI

### Opportunities
- Show invitation status (sent, opened, accepted, expired)
- Allow resending or canceling invitations
