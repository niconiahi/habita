---
name: data_validation
description: Guidelines when using methods that are not type-safe
---

Whenever you execute one of the following commands, you'll always validate its return value with a _validation schema_ from Valibot

- `response.json()`
- `formData.get()`
- `searchParams.get()`
- `cookies.get()`
- `localStorage.getItem()`
- `JSON.parse()`

> NOTE

You don't need to validate query interactions, as it's completely type-safe end to end by Kysely

## Inside actions

In actions, use `normalize_input` + `v.safeParse` with an `InputSchema` instead of bare `v.parse` on individual fields. This handles `formData.get()` validation automatically. See the `error_handling` and `actions` skills for the full pattern.

## In loaders, API routes, and other contexts

Use `v.parse` directly — these are expected validations where throwing is acceptable (SvelteKit catches loader throws).

### response.json()

```ts
// $lib/server/mercado_pago_payment.ts
const data = await response.json()
const preference = v.parse(
  MercadoPagoPreferenceSchema,
  data,
)
```

### searchParams.get()

```ts
// routes/admin/contracts/+page.server.ts
const state = v.parse(ContractStateSchema, url.searchParams.get("state"))
```

## JSON.parse() — always inside `v.transform`

`JSON.parse` throws `SyntaxError` on invalid input. Never call it bare. Always put it inside a `v.transform` within a Valibot pipeline so `v.safeParse` catches the throw:

```ts
const InputSchema = v.object({
  location: v.pipe(
    v.string("La ubicación es requerida"),
    v.transform((val) => JSON.parse(val)),
    LocationSchema,
  ),
})
```

If you're outside a Valibot pipeline (e.g. API route), use `safe_sync`:

```ts
const [error, parsed] = safe_sync(() => JSON.parse(text))
```

## Locally constructed data — use `satisfies`, not `v.parse`

When building an object from local/trusted data (not external input), use `satisfies` with the Valibot-inferred type instead of `v.parse`. `satisfies` enforces completeness at compile time — if you miss a key, TypeScript catches it immediately. `v.parse` only validates at runtime and won't error on missing keys at compile time.

```ts
// Correct — compile-time completeness check
notification_emitter.emit(
  NOTIFICATION_EVENT,
  {
    id: notification.id,
    type: notification.type,
    href: notification.href,
    property_id: notification.property_id,
    created_at: notification.created_at.toISOString(),
    location: {
      road: property.location.road,
      house_number: property.location.house_number,
    },
  } satisfies PropertyVisitNotification,
)
```

Use `v.parse` for **external/untrusted** data (API responses, SSE events, form input). Use `satisfies` for **locally constructed** data where the types are already known.
