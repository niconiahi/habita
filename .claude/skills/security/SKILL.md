---
name: security
description: Authentication and authorization patterns. Use when implementing auth checks, protecting routes, handling sessions, or managing user access control.
---

# Authentication

- Uses **Better Auth** with SvelteKit integration
- `hooks.server.ts` extracts the session and populates `event.locals.user` and `event.locals.session`
- Every protected route uses `require_authentication(locals)` which narrows both `locals.user` and `locals.session` to non-null

```ts
import { require_authentication } from "$lib/server/auth"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  require_authentication(locals)
  // locals.user and locals.session are guaranteed non-null after this call
  // No optional chaining needed: locals.user.id, locals.session.activeOrganizationId
}
```

# Authorization — Two-Layer Model

## Layer 1: RBAC (Better Auth `hasPermission`)

Organization-level roles (landlord, realtor, manager, tenant) with permissions like `{ property: ["read"] }`.

## Layer 2: ACL (`property_access` table)

Property-specific access checked via `require_property_access()` which combines both layers.

## Helper functions (`$lib/server/property_access.ts`)

```ts
import { require_edit_access } from "$lib/server/property_access"

// In a loader or action:
await require_edit_access(
  request.headers,
  locals.user.id,
  property_id,
  locals.session?.activeOrganizationId,
)
```

Available helpers:
- `require_view_access()` — read access (landlord, manager, tenant)
- `require_edit_access()` — write access (landlord, manager)
- `require_landlord_access()` — landlord only
- `get_accessible_property_ids()` — bulk query for property IDs a user can access
- `assign_property_access()` — grant access
- `is_tenant_accessible()` — check if a tenant belongs to managed properties
- `is_manager_of_visitant_file()` — check if user is manager/landlord of a property where the file owner has a visit slot. Used by `/files/[file_id]` as a fallback when the file can't be resolved through direct ownership paths (e.g., candidate documents)
- `revoke_all_access_by_type()` — revoke access

### Resources

[better-auth documentation](https://www.better-auth.com)
[middleware authentication best practices](https://pilcrowonpaper.com/blog/middleware-auth)
