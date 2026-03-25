# Manager: Renew subscription

## The Lens

**Actor:** Freelance property manager.

**Goal:** Renew their platform subscription before access is blocked.

**Scenario:** The manager's subscription is expiring. They see a warning banner, navigate to the subscription page, and complete payment.

---

## The Experience

### Phase 1: Notice Warning

**Routes:** `/` (root layout — SubscriptionBanner on every page)

**Actions:**
- Sees a warning banner showing days remaining in the grace period

**Thoughts:**
- "How many days left?"
- "What happens if I don't renew?"

**Emotions:** Alerted → Motivated

---

### Phase 2: Review and Pay

**Routes:** `/subscribe` → Mercado Pago → `/subscribe/success`

**Actions:**
- Goes to the subscription page
- Reviews the price ($50 USD for freelance)
- Clicks "Pay"
- Completes payment on Mercado Pago
- Returns to success page

**Thoughts:**
- "Same price as last time?"
- "Did the payment work?"

**Emotions:** Resigned → Relieved (subscription renewed)

---

## The Output

### Pain Points
- No clarity on grace period consequences (what's blocked and when)
- External payment flow

### Opportunities
- Clearly communicate what happens at each stage (active → grace → blocked)
- Consider auto-renewal
- Send reminder emails before grace period begins
