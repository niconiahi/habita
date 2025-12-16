---
name: svelte
description: Svelte component patterns and conventions. Use when creating Svelte components, exporting schemas/types, or working with component-related code.
---

This skill guides on best practices when creating Svelte-related code. This is how this team writes Svelte, so it should be respected to the detail.

## Schema Colocation Pattern

When a Svelte component needs to export schemas, types, or constants that are used by both the component and external files (like server actions), create a colocated `.schemas.ts` file.

### Why?

Svelte components cannot export non-prop values from their instance `<script>` block. While `<script module>` exists, extracting to a sibling file is cleaner and makes imports more explicit.

### Convention

```
src/lib/components/
├── LocationInput.svelte          # The UI component
└── LocationInput.schemas.ts      # Colocated schemas and types
```

### Example

**LocationInput.schemas.ts**
```typescript
import * as v from "valibot"

export const LocationSchema = v.object({
  place_id: v.number(),
  lat: v.number(),
  lon: v.number(),
  display_name: v.string(),
})

export type Location = v.InferOutput<typeof LocationSchema>
```

**LocationInput.svelte**
```svelte
<script lang="ts">
  import { LocationSchema, type Location } from "./LocationInput.schemas"
  // Use relative import to make colocation explicit
</script>
```

**Server action importing the schema**
```typescript
import { LocationSchema } from "$lib/components/LocationInput.schemas"
```

### When to use `.schemas.ts`

- Component has validation schemas (valibot, zod, etc.)
- Component has types needed by server code
- Component has constants shared with other files

### When NOT to use `.schemas.ts`

- Types are only used within the component itself (keep them in the `<script>` block)
- Simple prop types (use `interface Props` inline)

## Snippets for Page Organization

When a page component has multiple logical sections, use Svelte 5 snippets to extract them. This mirrors the React pattern of local function components and makes the main render self-documenting.

### Why?

- The snippet name documents what each section does (no comments needed)
- The main template becomes scannable at a glance
- Snippets have access to all reactive state without prop drilling

### Pattern

```svelte
<script lang="ts">
  let { data } = $props()
  let some_state = $state(false)
</script>

{#snippet Location()}
  <Section>
    <!-- Location form markup -->
  </Section>
{/snippet}

{#snippet Members()}
  <Section>
    <!-- Members list markup -->
  </Section>
{/snippet}

<Content.Root>
  <Content.Title>Page Title</Content.Title>
  {@render Location()}
  {@render Members()}
</Content.Root>
```

### When to use snippets

- Page has 3+ distinct sections
- You're tempted to add `<!-- Section Name -->` comments
- Migrating from React where local function components were used

### When NOT to use snippets

- Simple pages with 1-2 small sections
- The markup is already short and scannable
