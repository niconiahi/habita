---
name: vite
description: Vite HMR singleton patterns. Use when creating module-level instances (DB clients, Kafka, Redis, EventEmitters) that must survive hot module replacement in dev.
---

# HMR-Safe Singletons

Vite's HMR re-evaluates modules on code changes. This creates duplicate instances of heavy objects (DB pools, Kafka clients, Redis connections), leaking connections and memory.

## The pattern

Use `globalThis` to persist instances across HMR cycles. Extract a `make_*` function for readability when construction needs validation or multiple steps:

```ts
// Simple — inline is fine
const emitter = (globalThis.__emitter ??= new EventEmitter()) as EventEmitter

// Complex — extract a make_* function
function make_kafka() {
  return new Kafka({
    clientId: "habita",
    brokers: (process.env.BROKER_BROKERS ?? "redpanda:9092").split(","),
  })
}

const kafka = (globalThis.__kafka ??= make_kafka()) as Kafka
```

## Rules

- **One `globalThis.__name` per singleton.** Name it after what it holds: `__kafka`, `__redis`, `__query_builder`, `__auth`.
- **Never abstract this into a utility.** The pattern is one line — an abstraction adds complexity without reducing duplication.
- **Always cast the result.** `globalThis` returns `unknown`, so cast: `as Kafka`, `as Redis`, etc.
- **Use `??=` (nullish coalescing assignment).** This ensures the instance is created only once and reused on subsequent HMR cycles.
- **Don't guard with `NODE_ENV`.** The `??=` is a no-op after first assignment in production anyway. No `if (process.env.NODE_ENV !== "production")` checks — keep it unconditional.
- **Use `make_*` for non-trivial construction.** If the instance needs env validation or multi-step setup, extract a named `make_*` function. No IIFEs.

## SvelteKit build-time caveat

SvelteKit runs a postbuild `analyse` phase that imports server modules. If a `globalThis.__x ??= make_x()` line is at module scope, `make_x()` executes during build — when no env vars or services are available.

**For modules imported by routes** (query_builder, auth, kv, kafka producer): defer initialization so it only runs on first access, not at import time.

```ts
// Deferred via Proxy — safe during SvelteKit build
let _query_builder: Kysely<DB> | undefined

export const query_builder = new Proxy({} as Kysely<DB>, {
  get(_, property, receiver) {
    if (!_query_builder) {
      _query_builder = (globalThis.__query_builder ??=
        make_query_builder()) as Kysely<DB>
    }
    return Reflect.get(_query_builder, property, receiver)
  },
})
```

```ts
// Deferred via getter function — for objects with method wrappers (like kv)
function get_client(): Redis {
  return (globalThis.__redis ??= make_redis()) as Redis
}

export const kv = {
  async get(key: string) { return await get_client().get(key) },
}
```

**For modules NOT imported by routes** (notification_emitter, dialect): eager `globalThis.__x ??=` is fine.

**For standalone processes** (broker consumers): eager `globalThis.__x ??=` is fine — no SvelteKit build analysis.

## Anti-patterns

```ts
// BAD: generic lazy with hidden caching
const kafka = lazy(() => new Kafka({ ... }))

// BAD: module-scoped variable without globalThis (duplicated on HMR)
const kafka = new Kafka({ ... })

// BAD: NODE_ENV guard — unnecessary with ??=
if (process.env.NODE_ENV !== "production") globalThis.__kafka = kafka

// BAD: IIFE — use a named make_* function instead
const kafka = (globalThis.__kafka ??= (() => new Kafka({ ... }))()) as Kafka

// GOOD: simple
const kafka = (globalThis.__kafka ??= new Kafka({ ... })) as Kafka

// GOOD: complex with make_*
const kafka = (globalThis.__kafka ??= make_kafka()) as Kafka
```
