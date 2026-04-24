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

- Never use the non-null assertion operator (`!`). It bypasses the type system instead of working with it. "I don't want to see that in my code. They are lazy to me." Narrow the type early with proper conditionals, then use the narrowed value. If TypeScript complains, the code structure is wrong — fix the structure, not the types. What you do after narrowing is a design decision: return, throw, log, error() — whatever fits the context.

```ts
// bad — bypasses the type system
const id = data.warranty!.id

// good — narrow the type, then decide what to do
if (!data.warranty) {
  // your call: return, throw, log, error() — whatever fits the context
}
const id = data.warranty.id
```

- Never use `void expression`, `JSON.stringify(obj)`, or any other hack to force Svelte reactivity tracking. "They make me wanna vomit." If `$effect` needs to track dependencies, read the actual properties inline — don't hide them inside function calls and then hack around the tracking. If the dependency isn't visible to Svelte, restructure the code so it is.

- Every `<Button>` must have an explicit `variant` prop. No bare `<Button>` without one. ALWAYS.

- No magic numbers or magic strings — extract named constants or utility functions. If a value appears in logic (not just a data literal), it must have a name that explains its purpose.

```ts
// bad
const retry_count = Number(message.headers?.["retry-count"]?.toString() ?? "0")
if (retry_count < 3) { ... }

// good
const retry_count = get_retry_count(message.headers)
if (retry_count < MAX_RETRIES) { ... }
```

- Verbose log messages (console.log, echo) in scripts, seeds, seeders, and bin commands must follow these rules:
  - all lowercase
  - no trailing "..."
  - no numbered steps (like "1.", "2.")
  - no contractions ("don't" → "do not", "can't" → "cannot")

```ts
// bad
console.log("Creating user...")
console.log("1. Stopping app services...")
console.log("Setup complete. Don't forget to restart.")

// good
console.log(`creating user ${user.id}`)
console.log("stopping app services")
console.log("setup complete. do not forget to restart")
```

```bash
# bad
echo "Starting storage..."
echo "1. Stopping database..."
echo "Done."

# good
echo "starting storage"
echo "stopping database"
echo "done"
```
