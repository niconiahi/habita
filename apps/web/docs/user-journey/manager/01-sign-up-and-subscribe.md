# Manager: Sign up and subscribe

## The Lens

**Actor:** Freelance property manager — an independent person who manages rental properties.

**Goal:** Create an account, choose the freelance plan, and pay for the subscription to unlock the admin dashboard.

**Scenario:** A freelance manager discovers Habita and wants to start managing their properties through the platform. They sign up, select the freelance account type, and complete their first subscription payment.

---

## The Experience

### Phase 1: Create Account

**Routes:** `/signup`

**Actions:**
- Fills in name, surname, email, password (or Google signup)
- Submits the form
- Gets redirected to onboarding

**Thoughts:**
- "What does this platform offer me?"
- "How much will it cost?"

**Emotions:** Evaluating → Proceeding

---

### Phase 2: Choose Freelance Account

**Routes:** `/onboarding`

**Actions:**
- Sees three options: Tenant, Freelance, Real estate agency
- Clicks "Freelance" — described as "manage properties independently"
- System creates the organization and subscription automatically

**Thoughts:**
- "Freelance vs agency — I work alone, so freelance"
- "What's included?"

**Emotions:** Clear → Committed

---

### Phase 3: Pay for Subscription

**Routes:** `/subscribe` → Mercado Pago (external) → `/subscribe/success`

**Actions:**
- Lands on the subscription page showing $50 USD/month
- Clicks "Pay"
- Gets redirected to Mercado Pago
- Completes payment
- Returns to success page

**Thoughts:**
- "Is $50/month worth it?"
- "Can I cancel later?"
- "Is the payment secure?"

**Emotions:** Hesitant → Relieved (subscription active, admin unlocked)

---

## The Output

### Pain Points
- No trial period or free tier — managers must pay before seeing the admin dashboard
- Price is shown only after choosing the account type, not before
- No clarity on what happens if they don't pay right away

### Opportunities
- Show pricing on the onboarding page before the manager commits
- Consider a trial period or limited free access
