---
name: coding_guidelines
description: Mandatory code style rules. Use always when writing any code - covers naming conventions, function declarations, and formatting.
---

# Obligatory code style

- Every function name should be `snake_case`

```ts
function create_user() {}
```

- Every variable name should be `snake_case`

```ts
const remaining_users = get_remaining_users()
```

- Standalone functions use the `function` keyword

```ts
function create_user() {}
```

- Arrow functions are fine for framework handlers and callbacks (SvelteKit load/actions, Kysely query builders, Valibot transforms)

```ts
export const load: PageServerLoad = async ({ locals }) => {}

export const actions: Actions = {
  [ACTION.UPDATE_LOCATION]: async ({ request, locals }) => {},
}

query_builder.selectFrom("slot").select((eb) => [])

v.pipe(v.string(), v.transform((value) => Number(value)))
```

- Use blank lines to separate imports from code, functions from each other, and logical blocks within functions

- If a variable is only used once and its value is just a function call result, inline it directly. Don't create intermediate variables for single-use function results.

```ts
// bad
const encrypted_content = encrypt_buffer(content)
const inserted = await db.insertInto("file").values({ content: encrypted_content })

// good
const inserted = await db.insertInto("file").values({ content: encrypt_buffer(content) })
```

- Schemas, types, and constants live in the file where they are used. No `.schemas.ts` sibling files. If a Svelte component needs to export schemas or types, use `<script module>`. If an action needs a validation schema, define it inline in the action file.

- No magic numbers or magic strings — extract named constants or utility functions. If a value appears in logic (not just a data literal), it must have a name that explains its purpose.

```ts
// bad
const retry_count = Number(message.headers?.["retry-count"]?.toString() ?? "0")
if (retry_count < 3) { ... }

// good
const retry_count = get_retry_count(message.headers)
if (retry_count < MAX_RETRIES) { ... }
```
