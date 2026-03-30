# Realtor: Renew team subscription

## The Lens

**Actor:** Real estate agency owner.

**Goal:** Renew the agency's subscription so the team can continue using the platform.

**Scenario:** The agency's subscription is expiring. The owner needs to pay before access is blocked for the entire team.

---

## The Experience

### Phase 1: Notice Warning

**Routes:** `/` (root layout — SubscriptionBanner)

**Actions:**

- Sees a warning banner showing days remaining

**Thoughts:**

- "If I don't pay, my whole team loses access"
- "How much is it this time? ($40 × seat count)"

**Emotions:** Urgent → Motivated

---

### Phase 2: Pay

**Routes:** `/subscribe` → Mercado Pago → `/subscribe/success`

**Actions:**

- Reviews the total: $40 USD × number of seats
- Sees the seat breakdown
- Completes payment

**Thoughts:**

- "The cost went up since we added a new manager"
- "Is there a way to reduce seats?"

**Emotions:** Calculating → Relieved (team access renewed)

---

## The Output

### Pain Points

- Only admins can renew — team members see "your admin must renew" but the admin may not be aware
- No email notification to the admin when subscription is expiring

### Opportunities

- Send admin-specific email reminders before expiration
- Consider showing seat management (add/remove seats before paying)
