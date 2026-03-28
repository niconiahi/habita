# Realtor (Agency Owner) — Jobs to Be Done

> Inferred emotional and social dimensions are marked with *(validate)* — the designer should confirm these with real users.
>
> The realtor has all the same jobs as a property manager (they can manage properties directly) plus the organizational jobs below. This file covers only what's unique to the realtor role.

---

## Primary job

**"When I run a real estate agency, I want to organize my team and distribute properties among managers, so the agency operates efficiently and I can scale beyond what I could handle alone."**

### Functional dimension
Build a team of property managers, assign properties to them, monitor workload distribution, and maintain the agency's subscription. The realtor is the administrative layer on top of property management.

### Emotional dimension *(validate)*
Feel that the business is running smoothly without needing to micromanage every property. The agency model should amplify the realtor's capacity, not create more management overhead.

### Social dimension *(validate)*
Be perceived as a professional agency — by landlords (who expect organizational capacity), by managers (who expect fair workload distribution), and by tenants (who expect consistent quality regardless of which manager handles their property).

---

## Secondary jobs

### Grow the team by bringing in new managers

**"When I need more capacity to handle new properties, I want to invite managers into my agency, so I can distribute the workload and take on more clients."**

- **Functional:** Send email invitations to new managers. They join the agency's organization and get assigned to a team. During the free trial, the agency is limited to 1 additional manager — after the first payment, this restriction lifts.
- **Emotional** *(validate)*: Feel that growing the team is straightforward, not bureaucratic. The trial limitation should feel like a reasonable safeguard, not an arbitrary restriction.
- **Social** *(validate)*: Be perceived as a growing, active agency — new hires signal business health to landlords and partners.

### Remove managers who are no longer part of the team

**"When a manager leaves the agency, I want to cleanly revoke their access, so they can no longer see or modify any of the agency's properties."**

- **Functional:** Remove the manager's property access entries and their organization membership in one operation. Properties they managed are left unassigned (not deleted or transferred automatically).
- **Emotional** *(validate)*: Feel that the separation is complete and secure. No lingering access, no ambiguity about who can see what.
- **Social** *(validate)*: Minimal — this is an administrative action.

### Redistribute properties between managers

**"When workload is uneven or a manager leaves, I want to move properties from one manager to another, so no property is left unattended."**

- **Functional:** Revoke all manager access for a property and optionally assign a new manager. View each manager's current property count to assess workload distribution.
- **Emotional** *(validate)*: Feel that the agency's workload is balanced and no property is neglected. An unmanaged property is a liability — lost rent, unhappy landlords.
- **Social** *(validate)*: Be perceived by managers as fair in workload distribution. Favoritism or overloading would hurt team morale.

### Monitor the agency's capacity and structure

**"When I need to assess the state of my agency, I want to see all managers and how many properties each one handles, so I can make informed decisions about hiring, firing, and reassignment."**

- **Functional:** View the agency's details, a list of all managers with their property counts, and the overall organizational structure.
- **Emotional** *(validate)*: Feel informed about the business. The dashboard should answer "how is the agency doing?" at a glance, not require digging through individual properties.
- **Social** *(validate)*: Be perceived as a data-driven, professional operator by anyone reviewing the agency's structure (partners, potential investors, new hires).

### Keep the agency's subscription active

**"When the agency's subscription is expiring, I want to renew it before the team loses access, so operations don't get disrupted."**

- **Functional:** Understand the pricing model (per-seat: $40 USD × number of managers), see the expiration date, and complete payment through the payment provider. Renewal reminders are sent via email starting 7 days before expiration. A 7-day grace period allows continued access after expiration before full lockout.
- **Emotional** *(validate)*: Feel that the renewal process is predictable and not a surprise. The grace period should feel like a safety net, not a countdown to disaster. The pricing should feel fair relative to the value — each seat enables a manager to operate multiple properties.
- **Social** *(validate)*: Be perceived as someone who keeps the business running. If the subscription lapses, every manager in the agency loses admin access — the realtor's failure to renew affects the entire team.

---

## Consumption jobs

- **Subscription management:** The realtor is the only person who can renew the agency's subscription. If they're unavailable (vacation, illness), other team members see a message saying "your administrator needs to renew" but can't act. This single point of failure is a significant consumption friction.
- **Trial limitations:** During the 30-day trial, the agency can only have 1 manager beyond the realtor. This means the realtor can't fully test the agency model (multi-manager operations) without paying first. The trial demonstrates single-manager workflow but not the core value proposition of team management.
- **Seat-based pricing awareness:** When the realtor invites a new manager, the subscription cost increases at the next renewal. There's no upfront confirmation of "this will increase your bill from $X to $Y" — the realtor needs to calculate this themselves based on the per-seat price.
- **Property orphaning on manager removal:** When a manager is removed, their properties become unassigned. The realtor needs to remember to reassign them — there's no automatic notification or prompt about orphaned properties.
