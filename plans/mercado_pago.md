# Mercado Pago Payment Integration Plan

Based on the Morfar app documentation using Checkout Preferences API.

## Phase 1: Database Schema

### 1.1 Create Payment Tables Migration
- [ ] Create new migration file `apps/web/db/migrations/[timestamp]_add_payment_tables.ts`
- [ ] Define `payment` table schema:
  - [ ] Add `id` (serial primary key)
  - [ ] Add `payment_method_id` (integer, not null)
  - [ ] Add `property_id` (integer, references property(id)) - **REQUIRED for linking payment to property**
  - [ ] Add `preference_id` (text, nullable) - stores MP preference ID
  - [ ] Add `amount` (numeric, not null) - payment amount in ARS
  - [ ] Add `created_at` (timestamp, not null)
  - [ ] Add `updated_at` (timestamp, not null)
- [ ] Define `payment_mercado_pago` table schema:
  - [ ] Add `id` (serial primary key)
  - [ ] Add `operation_id` (text, nullable, stores MP payment ID from callback)
  - [ ] Add `status` (integer, not null, 0=APPROVED, 1=REJECTED, 2=PENDING)
  - [ ] Add `payment_id` (integer, not null, foreign key to payment)
  - [ ] Add `created_at` (timestamp, not null)
  - [ ] Add `updated_at` (timestamp, not null)

**PostgreSQL migration SQL:**
```sql
CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    payment_method_id INTEGER NOT NULL,
    property_id INTEGER REFERENCES property(id),
    preference_id TEXT,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_mercado_pago (
    id SERIAL PRIMARY KEY,
    operation_id TEXT,
    status INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (payment_id) REFERENCES payment (id)
);
```

### 1.2 Create Payment Status Constants
- [ ] Create file `apps/web/app/lib/payment_status.ts`
- [ ] Define `PAYMENT_STATUS` constant object:
  - [ ] Add `APPROVED: 0`
  - [ ] Add `REJECTED: 1`
  - [ ] Add `PENDING: 2`
- [ ] Export TypeScript type for payment status

### 1.3 Run Migration
- [ ] Run `bun run db:migrate` to apply migration
- [ ] Run `bun run db:types` to regenerate database types
- [ ] Verify new types are available in `db/types.ts`

## Phase 2: Property Publish with Payment

### 2.1 Add Publish Intent to Property Edit Route
- [ ] Edit `apps/web/app/routes/properties+/$property_id+/edit/_index.tsx`
- [ ] Add `PUBLISH_PROPERTY: "publish_property"` to INTENT constant
- [ ] Add case for `INTENT.PUBLISH_PROPERTY` in action switch

### 2.2 Create Publish Property Action
- [ ] Create file `apps/web/app/routes/properties+/$property_id+/edit/actions/server/publish_property.server.ts`
- [ ] Verify `MERCADO_PAGO_ACCESS_TOKEN` exists in `.env`
- [ ] Implement `publish_property()` function:
  - [ ] Accept property_id parameter
  - [ ] Create payment record in `payment` table:
    ```typescript
    const payment = await query_builder
      .insertInto("payment")
      .values({
        payment_method_id: 1, // hardcoded or from config
        property_id: property_id,
        amount: 5000,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    ```
  - [ ] Build back_urls with paymentId query param:
    ```typescript
    const origin = get_origin()
    const back_urls = {
      success: `${origin}/payments/mercado_pago/success?paymentId=${payment.id}`,
      failure: `${origin}/payments/mercado_pago/failure?paymentId=${payment.id}`,
      pending: `${origin}/payments/mercado_pago/pending?paymentId=${payment.id}`,
    }
    ```
  - [ ] Build Mercado Pago checkout preference request body:
    ```typescript
    const preference = {
      items: [{
        title: "Publicación de propiedad",
        quantity: 1,
        unit_price: 5000,
      }],
      back_urls,
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" },
          { id: "atm" },
          { id: "bank_transfer" },
        ],
      },
      payer: { email: user.email }, // from authenticated user
    }
    ```
  - [ ] POST to `https://api.mercadopago.com/checkout/preferences`:
    - [ ] Add `Authorization: Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` header
    - [ ] Add `Content-Type: application/json` header
    - [ ] Parse response with Valibot to extract preference_id and init_point
  - [ ] Update payment record with preference_id:
    ```typescript
    await query_builder
      .updateTable("payment")
      .set({ preference_id: response.id })
      .where("id", "=", payment.id)
      .execute()
    ```
  - [ ] Return init_point URL for redirect
- [ ] Import and call this action in the edit route action handler
- [ ] Redirect to init_point URL using `throw redirect(init_point)`

## Phase 3: Callback Routes

### 3.1 Success Callback Route
- [ ] Create file `apps/web/app/routes/payments+/mercado_pago+/success.tsx`
- [ ] Implement loader function:
  - [ ] Parse query params from URL:
    - [ ] `payment_id` - Mercado Pago's operation ID (rename from MP's param name)
    - [ ] `paymentId` - Our internal payment.id (passed via back_url)
  - [ ] Validate params with Valibot (both required)
  - [ ] Find payment record using Kysely:
    ```typescript
    const payment = await query_builder
      .selectFrom("payment")
      .select(["id", "property_id"])
      .where("payment.id", "=", Number(paymentId))
      .executeTakeFirstOrThrow()
    ```
  - [ ] Insert into `payment_mercado_pago` table:
    ```typescript
    await query_builder
      .insertInto("payment_mercado_pago")
      .values({
        status: PAYMENT_STATUS.APPROVED,
        operation_id: payment_id, // MP's payment ID
        payment_id: payment.id,
      })
      .execute()
    ```
  - [ ] Update property state to PUBLISHED:
    ```typescript
    await query_builder
      .updateTable("property")
      .set({ state: PROPERTY_STATE.PUBLISHED })
      .where("id", "=", payment.property_id)
      .execute()
    ```
  - [ ] Return data for UI (no redirect from loader)
- [ ] Create success confirmation UI component
- [ ] Display success message: "¡Propiedad publicada con éxito!"
- [ ] Add link/button to view published property

### 3.2 Failure Callback Route
- [ ] Create file `apps/web/app/routes/payments+/mercado_pago+/failure.tsx`
- [ ] Implement loader function:
  - [ ] Parse query params from URL:
    - [ ] `payment_id` - Mercado Pago's operation ID (may be null if user cancelled)
    - [ ] `paymentId` - Our internal payment.id
  - [ ] Handle null payment_id (user cancelled without attempting):
    ```typescript
    if (payment_id === "null" || payment_id === null) {
      return redirectDocument(`/properties/${property_id}/edit`)
    }
    ```
  - [ ] Validate paymentId with Valibot
  - [ ] Find payment record using Kysely:
    ```typescript
    const payment = await query_builder
      .selectFrom("payment")
      .select(["id", "property_id"])
      .where("payment.id", "=", Number(paymentId))
      .executeTakeFirstOrThrow()
    ```
  - [ ] Insert into `payment_mercado_pago` table:
    ```typescript
    await query_builder
      .insertInto("payment_mercado_pago")
      .values({
        status: PAYMENT_STATUS.REJECTED,
        operation_id: payment_id ? Number(payment_id) : null,
        payment_id: payment.id,
      })
      .execute()
    ```
  - [ ] Property state remains EDITING (no update needed)
  - [ ] Return data for UI (no redirect from loader)
- [ ] Create failure UI component
- [ ] Display error message: "El pago fue rechazado"
- [ ] Add button to retry: link back to property edit page

### 3.3 Pending Callback Route
- [ ] Create file `apps/web/app/routes/payments+/mercado_pago+/pending.tsx`
- [ ] Implement loader function:
  - [ ] Parse query params from URL:
    - [ ] `payment_id` - Mercado Pago's operation ID
    - [ ] `paymentId` - Our internal payment.id
  - [ ] Validate params with Valibot (both required)
  - [ ] Find payment record using Kysely:
    ```typescript
    const payment = await query_builder
      .selectFrom("payment")
      .select(["id", "property_id"])
      .where("payment.id", "=", Number(paymentId))
      .executeTakeFirstOrThrow()
    ```
  - [ ] Insert into `payment_mercado_pago` table:
    ```typescript
    await query_builder
      .insertInto("payment_mercado_pago")
      .values({
        status: PAYMENT_STATUS.PENDING,
        operation_id: Number(payment_id),
        payment_id: payment.id,
      })
      .execute()
    ```
  - [ ] Property state remains EDITING (no update needed)
  - [ ] Return data for UI (no redirect from loader)
- [ ] Create pending UI component
- [ ] Display pending message: "Tu pago aún está pendiente"
- [ ] Add message: "Te notificaremos cuando se confirme la publicación"

## Phase 4: Webhook Handler

### 4.1 Create Webhook Route
- [ ] Create file `apps/web/app/routes/webhooks+/mercado_pago.ts`
- [ ] Define webhook event schema with Valibot:
  - [ ] Accept `action` field (payment.created, payment.updated)
  - [ ] Accept `data.id` field (MP payment ID / operation_id)
  - [ ] Accept `type` field (payment)

### 4.2 Implement Webhook Logic
- [ ] Implement POST action function (no auth required for webhooks):
  - [ ] Parse request body as JSON
  - [ ] Validate against webhook schema
  - [ ] Extract operation_id from data.id (this is MP's payment ID)
  - [ ] Fetch full payment details from MP API:
    - [ ] GET `https://api.mercadopago.com/v1/payments/${operation_id}`
    - [ ] Add `Authorization: Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` header
    - [ ] Parse response with Valibot schema
  - [ ] Find matching payment_mercado_pago record by operation_id
  - [ ] Map MP status to internal status:
    - [ ] "approved" → PAYMENT_STATUS.APPROVED (0)
    - [ ] "rejected" → PAYMENT_STATUS.REJECTED (1)
    - [ ] "in_process" / "pending" → PAYMENT_STATUS.PENDING (2)
  - [ ] Update payment_mercado_pago.status in DB using Kysely
  - [ ] If status changed to APPROVED and property not yet published:
    - [ ] Get property_id from payment record
    - [ ] Update property.state to PROPERTY_STATE.PUBLISHED (1)
  - [ ] Return 200 OK response
- [ ] Add error handling for missing payments
- [ ] Add logging for webhook events

### 4.3 Configure Webhook in Mercado Pago
- [ ] Note: Add webhook URL to MP dashboard after deployment
- [ ] Webhook URL will be: `https://habita.rent/webhooks/mercado_pago`
- [ ] Test with MP webhook simulator

## Phase 5: Cleanup OAuth Code

### 5.1 Remove OAuth Route Files
- [ ] Delete `apps/web/app/routes/auth+/mercado_pago.ts`
- [ ] Delete `apps/web/app/routes/auth+/mercado_pago.callback.ts`
- [ ] Verify no imports reference these files

### 5.2 Clean Up Cookie Utilities
- [ ] Edit `apps/web/app/lib/cookies.server.ts`
- [ ] Remove `get_mercado_pago_verifier_cookie()` function
- [ ] Remove `get_mercado_pago_state_cookie()` function
- [ ] Verify no other files import these functions

### 5.3 Remove OAuth Library
- [ ] Delete `apps/web/app/lib/auth/mercado_pago.server.ts`
- [ ] Verify no imports reference this file

### 5.4 Fix Origin Error Message
- [ ] Edit `apps/web/app/lib/origin.ts:2`
- [ ] Change error message from "MERCADO_PAGO_CLIENT_SECRET is not set"
- [ ] To: "NODE_ENV is not set"

## Phase 6: Testing & Verification

### 6.1 Manual Testing
- [ ] Test property publish flow end-to-end
- [ ] Verify payment record is created
- [ ] Verify redirect to Mercado Pago checkout
- [ ] Test successful payment callback
- [ ] Verify property state changes to PUBLISHED after payment
- [ ] Test failed payment callback
- [ ] Verify property remains EDITING after failed payment
- [ ] Test pending payment callback
- [ ] Test webhook with MP simulator
- [ ] Verify database records are created correctly

### 6.2 Code Review
- [ ] Verify all functions use snake_case naming
- [ ] Verify all functions use `function` keyword (not arrows)
- [ ] Verify all routes call `require_auth()` explicitly (except webhooks)
- [ ] Verify all DB queries use Kysely query builder
- [ ] Verify all validation uses Valibot schemas

## Notes

### Database Schema Considerations
- **IMPORTANT:** The `payment` table needs a `property_id` field to link payments to properties
- Consider adding to migration:
  ```sql
  ALTER TABLE payment ADD COLUMN property_id INTEGER REFERENCES property(id);
  ```
- May also need `preference_id` (text) to track MP checkout preference ID
- Consider adding `amount` (numeric) to track payment amount (5000 ARS initially)
- Consider adding timestamps (created_at, updated_at) for audit trail
- The current schema from Morfar only has `payment_method_id`, but we need more fields

### Payment Flow Summary
1. User clicks "Publish" on property (state = EDITING)
2. System creates payment record with property_id and amount (5000 ARS)
3. System creates MP checkout preference and redirects user
4. User pays on Mercado Pago
5. MP redirects to success callback
6. Success callback creates payment_mercado_pago record
7. Success callback updates property.state to PUBLISHED
8. Webhook confirms final status (handles pending → approved transitions)

### Environment Variables Required
- `MERCADO_PAGO_ACCESS_TOKEN` - For API authentication (already exists in .env)

### Reference Implementation
Based on Morfar app implementation documented in `docs/mercado_pago_payments_in_another_app.md`
