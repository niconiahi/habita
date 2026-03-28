# Property Manager — Jobs to Be Done

> Inferred emotional and social dimensions are marked with *(validate)* — the designer should confirm these with real users.

---

## Primary job

**"When I'm responsible for renting out properties, I want to move each property from vacant to occupied with a signed contract and paying tenant, so I can generate income for the landlord and justify my management fee."**

### Functional dimension
List properties, attract candidates, evaluate them, select tenants, draft contracts with all legal requirements, get both parties to sign, and track ongoing payments. Do this across multiple properties simultaneously.

### Emotional dimension *(validate)*
Feel professionally competent and in control of a complex, multi-step process. Each property is a different stage (editing, published, rented) with different tasks — the manager needs to feel like nothing is falling through the cracks.

### Social dimension *(validate)*
Be perceived as a reliable, organized professional by landlords (who trust the manager with their asset) and tenants (who depend on the manager for a smooth process). The manager's reputation is their business.

---

## Secondary jobs

### Create an accurate, attractive property listing

**"When I take on a new property, I want to describe it completely and accurately — location, rooms, features, photos — so tenants can evaluate it without needing to contact me."**

- **Functional:** Enter the property's geocoded address, define each room (type, dimensions, position on a floor plan), add utility services, upload photos, tag features across 7 categories (21 tags total), set the intended use (residential/commercial) and construction year.
- **Emotional** *(validate)*: Feel confident that the listing represents the property faithfully. An inaccurate listing wastes everyone's time — visits from disappointed candidates are costly.
- **Social** *(validate)*: Be seen as thorough and professional. A well-crafted listing reflects the manager's competence.

### Control when and how the property is visible

**"When a property is ready for tenants, I want to publish it to the listing — and when it's not, I want to pull it back — so I'm not fielding inquiries for properties that aren't available."**

- **Functional:** Transition properties between editing (invisible), published (listed, visit calendar available), and rented (off-market). Continue editing details while a property is published.
- **Emotional** *(validate)*: Feel in control of the pipeline. No surprises from tenants contacting about a property that's already rented or still being prepared.
- **Social** *(validate)*: Appear organized to tenants — no stale listings that erode trust.

### Bring the landlord into the loop

**"When I manage a property on behalf of an owner, I want to give them access to the property's details and contract, so they trust that their asset is being handled properly."**

- **Functional:** Send an email invitation to the landlord with a time-limited token. The landlord accepts, gets linked to the property, and can view contract details. The landlord's identity is verified (email match).
- **Emotional** *(validate)*: Feel that the landlord relationship is transparent and formalized, not dependent on informal communication. Reduce the anxiety of being asked "what's happening with my property?"
- **Social** *(validate)*: Be perceived by the landlord as trustworthy and communicative — a manager who keeps owners informed proactively.

### Manage visit availability efficiently

**"When a property is published, I want to define when visits can happen, so I'm not overwhelmed with scheduling requests and can batch visits into convenient windows."**

- **Functional:** Create time slots by date and time range. Tenants pick from available slots — the manager doesn't negotiate individually. Slots can be removed if plans change. Receive a notification and email when someone books.
- **Emotional** *(validate)*: Feel that visit scheduling is handled by the system, not by manual back-and-forth. The calendar is a time-saver, not busywork.
- **Social** *(validate)*: Appear professional and organized to tenants — available times are structured, not "just call me."

### Evaluate candidates before committing to a tenant

**"When people have visited a property, I want to review their profiles and documents, so I can pick the most reliable tenant and avoid future problems."**

- **Functional:** See all candidates who booked visits across all managed properties. Review each candidate's personal information, uploaded documents (credit report, ID, income proof). Only see candidates for properties I manage — not other managers' candidates.
- **Emotional** *(validate)*: Feel confident in the decision. Choosing a bad tenant is expensive and stressful — the review process should provide enough information to make an informed choice.
- **Social** *(validate)*: Be seen by the landlord as someone who vets carefully, not someone who accepts the first person who shows up.

### Select a tenant and formalize the relationship

**"When I've found the right candidate, I want to promote them to tenant status, so the property's access control reflects reality and I can start drafting the contract."**

- **Functional:** Promote a candidate to tenant. This is exclusive — a property can only have one active tenant at a time. The previous tenant's access is revoked automatically.
- **Emotional** *(validate)*: Feel that the transition is clean and definitive. No ambiguity about who the current tenant is.
- **Social** *(validate)*: Minimal — this is an administrative action.

### Draft a contract that covers all legal requirements

**"When I need to formalize a rental, I want to configure every legal aspect of the contract — pricing, escalation, warranty, fines, items inventory — so the agreement is complete and enforceable."**

- **Functional:** Set contract type (short/long-term), dates, pricing periods, escalation type (IPC or ICL) and duration, fine and default amounts (fixed or percentage), early termination terms, bank account (CBU), court jurisdiction, showroom hours. Add contract items (with condition: good/defective) and attach files.
- **Emotional** *(validate)*: Feel that the contract is thorough and legally defensible. Argentine rental law is specific — missing a required clause or misconfiguring an escalation formula could cause problems months later.
- **Social** *(validate)*: Be perceived by both landlord and tenant as someone who drafts professional, complete contracts — not sloppy agreements that lead to disputes.

### Configure the right warranty for the situation

**"When the contract requires a guarantee, I want to set up whichever warranty type fits the tenant's situation, so the landlord is financially protected."**

- **Functional:** Choose between three warranty types, each with different data requirements:
  - Property warranty: guarantor offers real estate as collateral (requires cadastral data, property tax ID, geocoded location).
  - Income warranty: guarantors vouch with their salary (one or more guarantors, each with name/DNI/email).
  - Surety warranty: insurance company backs the rental (company name, policy number, company email).
- **Emotional** *(validate)*: Feel that the landlord's financial risk is covered. The warranty is the safety net — configuring it correctly provides peace of mind.
- **Social** *(validate)*: Be perceived by the landlord as someone who takes risk management seriously.

### Generate a professional contract document

**"When the contract is fully configured, I want to produce a formatted PDF that both parties can review and sign, so the agreement has a tangible, shareable form."**

- **Functional:** The system validates all required fields, composes an HTML document from the contract data, generates a PDF, encrypts it, and stores it. Previous drafts are replaced.
- **Emotional** *(validate)*: Feel that the output is professional — a document you can confidently put in front of a landlord and tenant.
- **Social** *(validate)*: The quality of the PDF reflects on the manager's professionalism.

### Get both parties to sign digitally

**"When the contract PDF is ready, I want both the landlord and tenant to sign it with legal validity, so the agreement is binding without requiring everyone to be in the same room."**

- **Functional:** Verify that both parties have digital certificates (by CUIL). Onboard anyone who doesn't. Send the PDF for signing — landlord first, then tenant. Track signing status (pending, signed, rejected, error). When both sign, the signed PDF is automatically stored and the contract activates.
- **Emotional** *(validate)*: Feel relief when both signatures are in. The signing process is the last hurdle before the contract is active — it should feel like crossing a finish line, not like navigating a bureaucracy.
- **Social** *(validate)*: Be perceived as modern and efficient — "we do digital signatures" signals professionalism to both landlord and tenant.

### Keep a bird's-eye view across all managed properties

**"When I manage multiple properties at different stages, I want to see all my contracts, tenants, and candidates in one place, so I can prioritize my time and catch anything that needs attention."**

- **Functional:** Cross-property views for contracts (filterable by state), tenants (with property association), and candidates (with promotion capability). Notifications for new visit bookings.
- **Emotional** *(validate)*: Feel that nothing is slipping. The admin panel should be a dashboard of confidence, not a source of anxiety about what you might be forgetting.
- **Social** *(validate)*: Minimal — this is a private management view.

### Ensure rent stays legally correct over time

**"When Argentine law requires periodic rent adjustments based on official indexes, I want the system to calculate new prices automatically, so I'm compliant without doing manual math."**

- **Functional:** Escalation rules (IPC or ICL) with configurable duration are applied automatically. The formula compares current month's index to four months prior. New pricing periods are created when contracts are due for adjustment.
- **Emotional** *(validate)*: Feel protected from legal risk. Getting the escalation wrong could mean undercharging (losing money) or overcharging (illegal). Automation removes the fear of manual error.
- **Social** *(validate)*: Be perceived as compliant and fair by both landlord and tenant. The rate index is public — there's no room for creative interpretation.

---

## Consumption jobs

- **Onboarding:** Choose the right account type (freelance or agency) and understand that a subscription is required. The 30-day free trial should feel like an invitation, not a trap.
- **Subscription renewal:** Remember to renew before the grace period ends. The system sends reminders, but the manager needs to understand the pricing model (flat rate for freelancers, per-seat for agencies) and justify it as a business expense.
- **Property editing workflow:** The edit page has 13 distinct actions (rooms, services, photos, tags, location, destinies, construction year, landlord invite). The manager needs to know what's needed vs optional, and in what order.
- **Contract editing workflow:** The edit page has 20+ distinct actions. The manager needs to understand which ones are prerequisites for others (e.g., warranty must exist before PDF generation, PDF must exist before sending for signing).
- **Digital signature coordination:** The manager can't force the landlord or tenant to sign — they can only send the request and check status. If either party lacks a digital certificate, the manager must initiate onboarding, which redirects to an external provider. This is the biggest friction point — it depends on third-party responsiveness.
- **Rate index awareness:** The manager needs to know that rate values are managed by the platform administrators. If a rate is missing for a given month, escalation calculations won't run correctly — but the manager has no visibility into this.
