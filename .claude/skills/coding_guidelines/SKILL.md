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
