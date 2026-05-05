# /webhooks/mercadopago

## Endpoint (`+server.ts` — POST only)

Handles Mercado Pago payment webhook notifications.

### Flow

1. Verifies webhook signature via HMAC-SHA256 (`x-signature` + `x-request-id` headers, `MERCADO_PAGO_WEBHOOK_SECRET`)
2. Validates payload against `MercadoPagoWebhookSchema`
3. For `type: "payment"` events: fetches full payment details from Mercado Pago API
4. Maps Mercado Pago status to internal `PAYMENT_STATUS` enum
5. Updates `payment_mercado_pago` record with new status and operation_id
6. If `APPROVED`: checks if it's a subscription payment → publishes `extend_subscription` event via broker

### Schemas

- `MercadoPagoWebhookSchema` — validates incoming webhook `{ type, data: { id } }`
- `MercadoPagoPaymentSchema` — validates fetched payment `{ status, preference_id }`

## Auth

Webhook signature verification (HMAC-SHA256). Returns 401 on invalid signature.

## Notes

- Uses test access token in development, production token otherwise
- try/catch wraps all external fetch calls
