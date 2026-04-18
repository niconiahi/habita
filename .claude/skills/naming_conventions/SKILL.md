---
name: naming_conventions
description: Naming conventions for variables, functions, files, and patterns. Use always when writing any code — covers how to name everything.
---

# Naming Conventions

## General rules

- All variables and functions: `snake_case`
- All constants (enum-like): `SCREAMING_SNAKE_CASE`
- All types: `PascalCase`
- CSS classes: `kebab-case`
- Svelte components: `PascalCase`
- Svelte snippets: `PascalCase`
- FormData variable: always `form_data`, never `formData`
- User-facing error messages: always in Spanish
- Never user contractions or abbreviations in names — always spell out the full word: `organization` not `org`, `subscription` not `sub`, `configuration` not `config`, `property` not `prop`. This applies to ALL names: variables, functions, parameters, loop iterators, logger strings. No exceptions.

## Variables named after what produced them

Variables are named after the source that produced them, not generic names like `result` or `error`.

### Validation

```ts
const input_validation = v.safeParse(InputSchema, normalize_input(form_data, InputSchema))
const input = input_validation.output
```

- `InputSchema` → `input_validation` (schema name drives variable name)
- Parsed output is always `input`

### safe_async tuples

Error (first element) named after the operation:

```ts
const [transaction_error] = await safe_async(query_builder.transaction()...)
const [insert_error] = await safe_async(query_builder.insertInto(...)...)
const [fetch_error, response] = await safe_async(fetch(...))
const [buffer_error, array_buffer] = await safe_async(response.arrayBuffer())
const [revoke_error] = await safe_async(revoke_all_access_by_type(...))
const [assign_error] = await safe_async(assign_property_access(...))
const [json_error, data] = await safe_async(response.json())
```

Data (second element) named after its content type: `response`, `array_buffer`, `property`, `preference`, `data`.

### DB query results

Singular for single record, plural for collections:

```ts
const candidate = await query_builder...executeTakeFirst()
const candidates = await query_builder...execute()
```

## Function prefixes

| Prefix | Use | Example |
|--------|-----|---------|
| `fetch_` | DB queries / data retrieval | `fetch_candidates()`, `fetch_property()` |
| `create_` | Insert operations (actions) | `create_room()`, `create_contract()` |
| `update_` | Update operations (actions) | `update_service()`, `update_contract()` |
| `destroy_` | Delete operations (actions) | `destroy_room()`, `destroy_service()` |
| `require_` | Authorization checks (throws) | `require_edit_access()`, `require_view_access()` |
| `display_` | Format values for display | `display_room_type()`, `display_contract_state()` |
| `get_` | Pure getters | `get_room_types()`, `get_property_states()` |
| `compose_` | Build/compose values | `compose_point()`, `compose_html()` |
| `handle_` | Event handlers (Svelte) | `handle_signup()`, `handle_file_change()` |
| `is_` / `has_` | Boolean predicates | `is_webmaster()`, `has_action_error()` |

## Schema naming

- Action input schemas: always `InputSchema`
- Domain schemas: `[Entity]Schema` — `LocationSchema`, `SlotStateSchema`, `ForceNumberSchema`

## Enum-like constants

Always define three things together: constant + type + schema.

```ts
export const ROOM_TYPE = {
  BEDROOM: 0,
  BATHROOM: 1,
} as const

export type RoomType = ObjectValues<typeof ROOM_TYPE>

export const RoomTypeSchema = v.picklist(Object.values(ROOM_TYPE))
```

`display_` and `get_` functions are optional additions.

## Error constants and types

Colocated in the same file as the utility function. Type name = function name in PascalCase:

```ts
export const SEND_EMAIL_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

export type SendEmailError = {
  type: ObjectValues<typeof SEND_EMAIL_ERROR>
  error: Error
}
```

## ACTION constants

Key is SCREAMING_SNAKE, value is snake_case matching the action function name:

```ts
export const ACTION = {
  CREATE_ROOM: "create_room",
  UPDATE_LOCATION: "update_location",
} as const
```

## Action error keys

The error key always matches the action function name:

```ts
// In create_room():
return [{ create_room: { execution: "Error al crear la habitación" } }, null] as const
```

## Kysely callback abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| `eb` | Expression builder |
| `tx` | Transaction |
| `oc` | OnConflict builder |

## Import alias

```ts
import * as v from "valibot"
```

## File and directory naming

- `actions/` — Action functions, one per file
- `actions/action.ts` — ACTION constant object
- `fetchers/` — DB query functions, colocated with route
- `.server.ts` — Server-only code
- `.client.ts` — Client-only code

## Timestamps

Always use `now` from `$lib/server/now`:

```ts
import { now } from "$lib/server/now"

{ created_at: now, updated_at: now }
```
