# Tenant: Sign up and choose account type

## The Lens

**Actor:** Tenant — a person looking for a place to rent.

**Goal:** Create an account on the platform and identify themselves as a tenant.

**Scenario:** Someone hears about Habita and wants to start looking for a rental. They create an account and choose "Tenant" as their account type, which directs them to complete their profile.

---

## The Experience

### Phase 1: Create Account

**Routes:** `/signup`

**Actions:**
- Fills in name, surname, email, and password (min 8 characters)
- Or clicks "Google" to sign up with their Google account
- Submits the form

**Thoughts:**
- "Is this platform trustworthy?"
- "Should I use my Google account or create a separate one?"

**Emotions:** Cautious → Committed (account created)

---

### Phase 2: Choose Account Type

**Routes:** `/onboarding`

**Actions:**
- Sees three options: Tenant, Freelance, Real estate agency
- Clicks "Tenant" (Inquilino)
- Gets redirected to `/profile` to complete their personal information

**Thoughts:**
- "I'm just looking for a place — which one is me?"
- "What do the other options do?"

**Emotions:** Brief confusion (three options) → Clear (tenant is obviously them)

---

## The Output

### Pain Points
- The onboarding page shows all three account types equally — a tenant might hesitate wondering if they need a "plan"
- The tenant option is a link, while the other two are form submissions — inconsistent interaction patterns

### Opportunities
- Make it clearer that the tenant path is free and doesn't require a subscription
