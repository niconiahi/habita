# Webmaster: Test payment integration

## The Lens

**Actor:** Webmaster — a platform administrator.

**Goal:** Verify that the Mercado Pago payment integration is working correctly.

**Scenario:** The webmaster needs to test the payment flow end-to-end by making a test payment and checking that all the pieces work (checkout, webhook, status update).

---

## The Experience

### Phase 1: Make Test Payment

**Routes:** `/pay`

**Actions:**
- Navigates to the test payment page
- Clicks to create a test payment (50 ARS)
- Gets redirected to Mercado Pago
- Completes the test transaction

**Thoughts:**
- "Is the integration still working?"
- "Will the webhook fire?"

**Emotions:** Testing → Verifying

---

### Phase 2: Check Result

**Routes:** `/pay/success` or `/pay/failure`

**Actions:**
- Returns from Mercado Pago
- Sees payment status (approved, pending, rejected)
- Verifies the operation ID

**Thoughts:**
- "Did it go through?"
- "Is the status updating correctly?"

**Emotions:** Checking → Confirmed (integration works) or Investigating (something's wrong)

---

## The Output

### Pain Points
- Test payments use real money (even if 50 ARS is small)
- No way to test webhook behavior separately
- No test log or history of past test payments

### Opportunities
- Add sandbox/test mode that doesn't process real money
- Show webhook event log for debugging
