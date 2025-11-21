# Phase 5: What to Trace in Loaders - Detailed Implementation Plan

## Overview

This phase instruments React Router loaders with OpenTelemetry tracing. We'll see the complete request flow in SigNoz: which loaders run, what data they fetch, authentication checks, cache hits/misses, and any errors.

**Goal**: Every loader execution creates a trace showing:
- Route that was loaded
- Authentication/authorization checks
- Database queries (auto-nested via Kysely plugin)
- Cache operations
- External API calls
- Business logic operations
- Full error context when things fail

---

## Part 1: Core Loader Tracing

### 1.1 Create Tracer Utility

**File**: `/apps/web/app/lib/telemetry/trace.server.ts`

```typescript
import { trace, type Span, type Tracer, SpanStatusCode } from '@opentelemetry/api'

// don't use wrapper functions for one liners
<!-- export function get_tracer(): Tracer { -->
<!--   return trace.getTracer('habita-web') -->
<!-- } -->
// just use trace.getTracer() directly, with a more contextual name inside

// don't use wrapper functions for one liners
<!-- export function get_current_span(): Span | undefined { -->
<!--   return trace.getActiveSpan() -->
<!-- } -->
// just use trace.getActiveSpan() directly

// don't use wrapper functions for one liners
<!-- export function add_span_attribute(key: string, value: string | number | boolean): void { -->
<!--   const span = get_current_span() -->
<!--   if (span) { -->
<!--     span.setAttribute(key, value) -->
<!--   } -->
<!-- } -->
// just use span.setAttribute() directly

export function record_span_error(span: Span, error: Error): void {
  span.recordException(error)
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
}
```

**Why these utilities?**
<!-- - `get_tracer()` - Single source for tracer instance -->
<!-- - `get_current_span()` - Access active span from anywhere -->
<!-- - `add_span_attribute()` - Add context to current span easily -->
- `record_span_error()` - Consistent error recording

---

### 1.2 Basic Loader Instrumentation Pattern

**Example**: Simple property list loader

**File**: `/apps/web/app/routes/properties._index.tsx`

```typescript
import { get_tracer } from '~/lib/telemetry/trace.server'
import { logger } from '~/lib/telemetry/log.server'
import { db } from '~/db/query_builder'

export async function loader({ request }: Route.LoaderArgs) {
  const tracer = trace.getTracer('loader')

  // isn't that all "fetch" related data are already instrumented because of the configuration?
  // meaning we don't have to instrument anything around "fetch"?
  return tracer.startActiveSpan('loader /properties', async (span) => {
    const url = new URL(request.url)
    span.setAttribute('http.method', 'GET')
    span.setAttribute('http.url', url.pathname)
    span.setAttribute('http.route', '/properties')
    const properties = await db
      .selectFrom('properties')
      .where('status', '=', 'active')
      .selectAll()
      .execute()
    span.setAttribute('properties.count', properties.length)
    logger.info('properties loaded', { count: properties.length })
    span.end()
    return { properties }
  })
}
```

**What you'll see in SigNoz**:
```
loader /properties (parent span)
├── http.method: GET
├── http.route: /properties
├── properties.count: 15
└── SELECT properties WHERE status = 'active' (child span from Kysely)
    ├── db.system: postgresql
    ├── db.statement: SELECT * FROM properties WHERE status = $1
    └── db.duration_ms: 12.3
```

---

## Part 2: Authentication & Authorization

### 2.1 Instrument `require_auth()` and `get_current_user()`

**File**: `/apps/web/app/lib/auth.server.ts` (or wherever auth is)

**Current implementation** (example):
```typescript
export async function require_auth(request: Request) {
  const session = await get_session_from_cookie(request)
  if (!session) {
    throw redirect('/login')
  }
  const user = await get_user_by_session(session.id)
  if (!user) {
    throw redirect('/login')
  }
  return { user, session }
}
```

**Instrumented version**:
```typescript
import { get_tracer } from '~/lib/telemetry/trace.server'
import { logger } from '~/lib/telemetry/log.server'

export async function require_auth(request: Request) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('auth.require_auth', async (span) => {
    span.setAttribute('auth.method', 'cookie')

    try {
      // Get session
      const session = await get_session_from_cookie(request)
      if (!session) {
        span.setAttribute('auth.has_session', false)
        logger.warn('no session found, redirecting to login')
        span.end()
        throw redirect('/login')
      }

      span.setAttribute('auth.has_session', true)
      span.setAttribute('auth.session_id', session.id)

      // Get user - this DB query will auto-nest as child span
      const user = await get_user_by_session(session.id)
      if (!user) {
        span.setAttribute('auth.user_found', false)
        logger.warn('session exists but user not found', { session_id: session.id })
        span.end()
        throw redirect('/login')
      }

      span.setAttribute('auth.user_found', true)
      span.setAttribute('auth.user_id', user.id)

      logger.info('user authenticated', { user_id: user.id })

      span.end()
      return { user, session }
    } catch (error) {
      if (error instanceof Response) {
        // Redirect is expected, not an error
        span.end()
        throw error
      }
      logger.error('auth check failed', {}, error as Error)
      span.end()
      throw error
    }
  })
}

export async function get_current_user(request: Request) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('auth.get_current_user', async (span) => {
    span.setAttribute('auth.method', 'cookie')

    const session = await get_session_from_cookie(request)
    if (!session) {
      span.setAttribute('auth.has_session', false)
      span.end()
      return null
    }

    span.setAttribute('auth.has_session', true)
    const user = await get_user_by_session(session.id)

    if (user) {
      span.setAttribute('auth.user_id', user.id)
    }

    span.end()
    return user
  })
}
```

**What you'll see in SigNoz**:
```
loader /properties/:id/edit
├── auth.require_auth
│   ├── auth.method: cookie
│   ├── auth.has_session: true
│   ├── auth.user_id: 123
│   └── SELECT users WHERE id = ? (child)
└── SELECT properties WHERE id = ? (child)
```

**If auth fails**:
```
loader /properties/:id/edit
└── auth.require_auth
    ├── auth.method: cookie
    ├── auth.has_session: false
    └── [redirected to /login]
```

---

## Part 3: Complex Data Fetching

### 3.1 Example: Property with Availability

**Scenario**: Loader fetches property + availability + images

**File**: `/apps/web/app/routes/properties.$id.book.tsx`

```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('loader /properties/:id/book', async (span) => {
    const url = new URL(request.url)
    span.setAttribute('http.method', 'GET')
    span.setAttribute('http.url', url.pathname)
    span.setAttribute('http.route', '/properties/:id/book')
    span.setAttribute('property.id', params.id)

    // Auth check - creates child span
    const { user } = await require_auth(request)
    span.setAttribute('user.id', user.id)

    // Fetch property data - wrap complex operation
    const property_data = await tracer.startActiveSpan(
      'data.fetch_property_with_availability',
      async (data_span) => {
        data_span.setAttribute('property.id', params.id)
        data_span.setAttribute('fetch.includes_availability', true)
        data_span.setAttribute('fetch.includes_images', true)

        // These DB queries will auto-nest as children
        const property = await db
          .selectFrom('properties')
          .where('id', '=', params.id)
          .selectAll()
          .executeTakeFirstOrThrow()

        const availability = await db
          .selectFrom('property_availability')
          .where('property_id', '=', params.id)
          .where('date', '>=', new Date())
          .selectAll()
          .execute()

        const images = await db
          .selectFrom('property_images')
          .where('property_id', '=', params.id)
          .orderBy('position', 'asc')
          .selectAll()
          .execute()

        data_span.setAttribute('availability.days_count', availability.length)
        data_span.setAttribute('images.count', images.length)

        logger.info('property data fetched', {
          property_id: property.id,
          availability_days: availability.length,
          images: images.length,
        })

        data_span.end()
        return { property, availability, images }
      }
    )

    span.end()
    return property_data
  })
}
```

**What you'll see in SigNoz**:
```
loader /properties/:id/book (45ms total)
├── http.route: /properties/:id/book
├── property.id: 456
├── user.id: 123
├── auth.require_auth (8ms)
│   └── SELECT users WHERE id = ? (5ms)
└── data.fetch_property_with_availability (32ms)
    ├── fetch.includes_availability: true
    ├── fetch.includes_images: true
    ├── availability.days_count: 30
    ├── images.count: 8
    ├── SELECT properties WHERE id = ? (10ms)
    ├── SELECT property_availability WHERE ... (15ms)
    └── SELECT property_images WHERE ... (7ms)
```

**Why this is useful**:
- See which queries are slow
- Understand data fetching patterns
- Spot N+1 queries immediately
- Debug missing data issues

---

## Part 4: Cache Operations

### 4.1 Instrument Redis/Cache

**File**: `/apps/web/app/lib/kv.server.ts`

**Current implementation** (example):
```typescript
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function get<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

export async function set(key: string, value: unknown, ttl_seconds?: number): Promise<void> {
  const serialized = JSON.stringify(value)
  if (ttl_seconds) {
    await redis.setex(key, ttl_seconds, serialized)
  } else {
    await redis.set(key, serialized)
  }
}
```

**Instrumented version**:
```typescript
import { Redis } from 'ioredis'
import { get_tracer } from '~/lib/telemetry/trace.server'
import { logger } from '~/lib/telemetry/log.server'

const redis = new Redis(process.env.REDIS_URL)

export async function get<T>(key: string): Promise<T | null> {
  const tracer = get_tracer()

  return tracer.startActiveSpan('cache.get', async (span) => {
    span.setAttribute('db.system', 'redis')
    span.setAttribute('db.operation', 'get')
    span.setAttribute('cache.key', key)

    const value = await redis.get(key)
    const hit = value !== null

    span.setAttribute('cache.hit', hit)

    if (hit) {
      logger.info('cache hit', { key })
    } else {
      logger.info('cache miss', { key })
    }

    span.end()
    return value ? JSON.parse(value) : null
  })
}

export async function set(key: string, value: unknown, ttl_seconds?: number): Promise<void> {
  const tracer = get_tracer()

  return tracer.startActiveSpan('cache.set', async (span) => {
    span.setAttribute('db.system', 'redis')
    span.setAttribute('db.operation', 'set')
    span.setAttribute('cache.key', key)
    if (ttl_seconds) {
      span.setAttribute('cache.ttl', ttl_seconds)
    }

    const serialized = JSON.stringify(value)
    if (ttl_seconds) {
      await redis.setex(key, ttl_seconds, serialized)
    } else {
      await redis.set(key, serialized)
    }

    logger.info('cache set', { key, ttl: ttl_seconds })

    span.end()
  })
}

export async function del(key: string): Promise<void> {
  const tracer = get_tracer()

  return tracer.startActiveSpan('cache.delete', async (span) => {
    span.setAttribute('db.system', 'redis')
    span.setAttribute('db.operation', 'delete')
    span.setAttribute('cache.key', key)

    await redis.del(key)

    logger.info('cache deleted', { key })

    span.end()
  })
}
```

### 4.2 Example: Cached Property Lookup

```typescript
export async function loader({ params }: Route.LoaderArgs) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('loader /properties/:id', async (span) => {
    span.setAttribute('property.id', params.id)

    const cache_key = `property:${params.id}`

    // Try cache first - creates child span
    let property = await get<Property>(cache_key)

    if (!property) {
      // Cache miss - fetch from DB (creates child span)
      span.setAttribute('data.source', 'database')

      property = await db
        .selectFrom('properties')
        .where('id', '=', params.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      // Store in cache (creates child span)
      await set(cache_key, property, 300) // 5 min TTL
    } else {
      span.setAttribute('data.source', 'cache')
    }

    span.end()
    return { property }
  })
}
```

**What you'll see in SigNoz (cache hit)**:
```
loader /properties/:id (8ms)
├── property.id: 789
├── data.source: cache
└── cache.get (5ms)
    ├── cache.key: property:789
    └── cache.hit: true
```

**What you'll see in SigNoz (cache miss)**:
```
loader /properties/:id (45ms)
├── property.id: 789
├── data.source: database
├── cache.get (5ms)
│   ├── cache.key: property:789
│   └── cache.hit: false
├── SELECT properties WHERE id = ? (25ms)
└── cache.set (8ms)
    ├── cache.key: property:789
    └── cache.ttl: 300
```

---

## Part 5: External API Calls

### 5.1 Example: Nominatim Geocoding

```typescript
async function geocode_address(address: string) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('http.get nominatim', async (span) => {
    span.setAttribute('http.url', 'http://nominatim:8090/search')
    span.setAttribute('geocoding.address', address)

    const start_time = Date.now()

    try {
      const response = await fetch(
        `http://nominatim:8090/search?q=${encodeURIComponent(address)}&format=json`
      )

      const duration = Date.now() - start_time
      span.setAttribute('http.status_code', response.status)
      span.setAttribute('http.duration_ms', duration)

      const data = await response.json()
      span.setAttribute('geocoding.results_count', data.length)

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`)
      }

      logger.info('geocoding successful', {
        address,
        results: data.length,
        duration_ms: duration,
      })

      span.end()
      return data[0] // Return first result
    } catch (error) {
      logger.error('geocoding failed', { address }, error as Error)
      span.end()
      throw error
    }
  })
}
```

**What you'll see in SigNoz**:
```
loader /properties/new
├── auth.require_auth
└── http.get nominatim (250ms)
    ├── http.url: http://nominatim:8090/search
    ├── geocoding.address: "123 Main St, Buenos Aires"
    ├── http.status_code: 200
    ├── geocoding.results_count: 5
    └── http.duration_ms: 248
```

---

## Part 6: Business Logic

### 6.1 Example: Availability Check

```typescript
async function check_property_availability(
  property_id: string,
  check_in: Date,
  check_out: Date
) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('business.check_availability', async (span) => {
    span.setAttribute('property.id', property_id)
    span.setAttribute('booking.check_in', check_in.toISOString())
    span.setAttribute('booking.check_out', check_out.toISOString())

    // Calculate days
    const days = Math.ceil(
      (check_out.getTime() - check_in.getTime()) / (1000 * 60 * 60 * 24)
    )
    span.setAttribute('booking.days', days)

    // Check for conflicts - DB query auto-nests
    const conflicts = await db
      .selectFrom('bookings')
      .where('property_id', '=', property_id)
      .where('status', '!=', 'cancelled')
      .where((eb) =>
        eb.or([
          eb.between('check_in', check_in, check_out),
          eb.between('check_out', check_in, check_out),
        ])
      )
      .selectAll()
      .execute()

    const is_available = conflicts.length === 0
    span.setAttribute('availability.is_available', is_available)
    span.setAttribute('availability.conflicts_count', conflicts.length)

    logger.info('availability checked', {
      property_id,
      check_in: check_in.toISOString(),
      check_out: check_out.toISOString(),
      is_available,
      conflicts: conflicts.length,
    })

    span.end()
    return { is_available, conflicts }
  })
}
```

**What you'll see in SigNoz**:
```
loader /properties/:id/book
├── auth.require_auth
├── data.fetch_property_with_availability
└── business.check_availability (45ms)
    ├── property.id: 456
    ├── booking.check_in: 2025-12-01T00:00:00Z
    ├── booking.check_out: 2025-12-05T00:00:00Z
    ├── booking.days: 4
    ├── availability.is_available: false
    ├── availability.conflicts_count: 2
    └── SELECT bookings WHERE ... (38ms)
```

---

## Part 7: Error Handling

### 7.1 Proper Error Recording

```typescript
export async function loader({ params }: Route.LoaderArgs) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('loader /properties/:id', async (span) => {
    span.setAttribute('property.id', params.id)

    try {
      const { user } = await require_auth(request)

      const property = await db
        .selectFrom('properties')
        .where('id', '=', params.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      // Check if user has access
      if (property.owner_id !== user.id && user.role !== 'admin') {
        span.setAttribute('error.type', 'authorization')
        logger.warn('unauthorized property access attempt', {
          user_id: user.id,
          property_id: params.id,
        })
        span.end()
        throw new Response('Forbidden', { status: 403 })
      }

      span.end()
      return { property }
    } catch (error) {
      if (error instanceof Response) {
        // HTTP responses are expected, not errors
        span.end()
        throw error
      }

      // Real errors get recorded
      logger.error('loader failed', {
        property_id: params.id,
        route: '/properties/:id',
      }, error as Error)

      span.end()
      throw error
    }
  })
}
```

**What you'll see when loader fails**:
```
loader /properties/:id (ERROR)
├── property.id: 999
├── auth.require_auth ✓
├── SELECT properties WHERE id = ? (ERROR)
│   ├── error.type: NoResultError
│   └── error.message: "no result"
└── [loader failed]
```

---

## Part 8: Complete Example

### 8.1 Full Property Booking Loader

```typescript
import { get_tracer } from '~/lib/telemetry/trace.server'
import { logger } from '~/lib/telemetry/log.server'
import { require_auth } from '~/lib/auth.server'
import { get, set } from '~/lib/kv.server'
import { db } from '~/db/query_builder'

export async function loader({ request, params }: Route.LoaderArgs) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('loader /properties/:id/book', async (span) => {
    // HTTP context
    const url = new URL(request.url)
    span.setAttribute('http.method', 'GET')
    span.setAttribute('http.url', url.pathname)
    span.setAttribute('http.route', '/properties/:id/book')
    span.setAttribute('property.id', params.id)

    try {
      // 1. Authentication - creates child span
      const { user } = await require_auth(request)
      span.setAttribute('user.id', user.id)

      // 2. Check cache - creates child span
      const cache_key = `property:${params.id}:booking_page`
      let cached_data = await get<any>(cache_key)

      if (cached_data) {
        span.setAttribute('data.source', 'cache')
        logger.info('booking page served from cache', {
          property_id: params.id,
          user_id: user.id,
        })
        span.end()
        return cached_data
      }

      span.setAttribute('data.source', 'database')

      // 3. Fetch property with related data - creates child span
      const property_data = await tracer.startActiveSpan(
        'data.fetch_property_booking_data',
        async (data_span) => {
          data_span.setAttribute('property.id', params.id)

          // All these create child spans via Kysely
          const property = await db
            .selectFrom('properties')
            .where('id', '=', params.id)
            .selectAll()
            .executeTakeFirstOrThrow()

          const owner = await db
            .selectFrom('users')
            .where('id', '=', property.owner_id)
            .select(['id', 'name', 'email'])
            .executeTakeFirstOrThrow()

          const images = await db
            .selectFrom('property_images')
            .where('property_id', '=', params.id)
            .orderBy('position', 'asc')
            .selectAll()
            .execute()

          const availability = await db
            .selectFrom('property_availability')
            .where('property_id', '=', params.id)
            .where('date', '>=', new Date())
            .selectAll()
            .execute()

          data_span.setAttribute('images.count', images.length)
          data_span.setAttribute('availability.days', availability.length)

          data_span.end()
          return { property, owner, images, availability }
        }
      )

      // 4. Store in cache - creates child span
      await set(cache_key, property_data, 300)

      logger.info('booking page data loaded', {
        property_id: params.id,
        user_id: user.id,
        images: property_data.images.length,
        availability_days: property_data.availability.length,
      })

      span.end()
      return property_data

    } catch (error) {
      if (error instanceof Response) {
        span.end()
        throw error
      }

      logger.error('booking page loader failed', {
        property_id: params.id,
        route: '/properties/:id/book',
      }, error as Error)

      span.end()
      throw error
    }
  })
}
```

**What you'll see in SigNoz (cache miss)**:
```
loader /properties/:id/book (125ms)
├── http.route: /properties/:id/book
├── property.id: 456
├── user.id: 123
├── data.source: database
├── auth.require_auth (12ms)
│   └── SELECT users WHERE id = ? (8ms)
├── cache.get (5ms)
│   ├── cache.key: property:456:booking_page
│   └── cache.hit: false
├── data.fetch_property_booking_data (95ms)
│   ├── images.count: 8
│   ├── availability.days: 90
│   ├── SELECT properties WHERE id = ? (18ms)
│   ├── SELECT users WHERE id = ? (15ms)
│   ├── SELECT property_images WHERE ... (28ms)
│   └── SELECT property_availability WHERE ... (32ms)
└── cache.set (8ms)
    ├── cache.key: property:456:booking_page
    └── cache.ttl: 300
```

---

## Implementation Checklist

### Core Setup
- [ ] Create `/apps/web/app/lib/telemetry/trace.server.ts` with utilities
- [ ] Verify Kysely telemetry plugin is working (Phase 4)
- [ ] Verify logger is working (Phase 3)

### Authentication
- [ ] Instrument `require_auth()` in auth file
- [ ] Instrument `get_current_user()` in auth file
- [ ] Test auth tracing works

### Cache Operations
- [ ] Instrument `get()` in kv.server.ts
- [ ] Instrument `set()` in kv.server.ts
- [ ] Instrument `del()` in kv.server.ts
- [ ] Test cache tracing works

### Loader Instrumentation (start with these critical loaders)
- [ ] `/properties._index` - Property list (simple)
- [ ] `/properties.$id` - Property detail (medium complexity)
- [ ] `/properties.$id.book` - Booking page (complex with cache)
- [ ] `/dashboard` - User dashboard (auth + multiple queries)
- [ ] `/bookings.$id` - Booking detail (auth + authorization check)

### External APIs (if applicable)
- [ ] Wrap Nominatim calls with tracing
- [ ] Wrap any other external API calls

### Business Logic (pick 2-3 important operations)
- [ ] Availability checking
- [ ] Price calculation
- [ ] Any other critical business logic

### Testing
- [ ] Load each instrumented route in browser
- [ ] Check SigNoz for traces
- [ ] Verify span nesting is correct
- [ ] Verify attributes are present
- [ ] Trigger error and verify error tracking works
- [ ] Check logs are correlated with traces

---

## Success Criteria

After implementing this phase, you should be able to:

✅ Open any page in the app and see its trace in SigNoz
✅ See complete request flow: auth → cache → db queries → response
✅ Identify which loaders are slow and why
✅ See cache hit rates for each endpoint
✅ Debug loader errors with full context
✅ Understand data fetching patterns across the app

---

## Next Steps

After Phase 5 is complete and working:
- **Phase 6**: Instrument actions (similar pattern but for POST/mutations)
- **Phase 7**: Create reusable tracing abstractions based on patterns learned
- **Phase 8**: Replace remaining console.log statements
- **Phase 9**: Instrument Go service
- **Phase 10**: End-to-end testing

---

## Notes

- Start with 2-3 simple loaders to validate the approach
- Don't instrument everything at once - do it incrementally
- Focus on loaders that are most important or most problematic
- Use consistent span naming: `loader /route/pattern`
- Always add business context as attributes
- The Kysely plugin handles DB query tracing automatically
- Errors should be logged AND recorded to spans
