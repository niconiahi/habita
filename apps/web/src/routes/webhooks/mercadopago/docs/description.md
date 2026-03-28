# Mercado Pago payment notifications

This is the endpoint that Mercado Pago calls whenever a payment status changes — for example, when a payment gets approved, rejected, or refunded. It's completely behind the scenes and not something users interact with.

When a payment is approved and it's related to a subscription, the system automatically extends the subscription period.
