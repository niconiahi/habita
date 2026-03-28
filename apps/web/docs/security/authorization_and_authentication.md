# Authorization & Authentication System

## Overview

Habita uses **Better Auth** for authentication and a **two-layer authorization model** for access control:

1. **Layer 1 (Role-based)**: Better Auth's `hasPermission()` checks if a role can perform an action type
2. **Layer 2 (Resource-level)**: `property_access` ACL table determines which specific properties a user is assigned to

## Authentication Layer

### Better Auth Configuration

Located at `src/lib/server/auth.ts`, Better Auth handles:

- **Session Management**: 30-day sessions with 15-day rolling refresh
- **Google OAuth**: Primary login method via `socialProviders.google`
- **Database Integration**: Direct PostgreSQL connection via `pg` Pool
- **Organizations**: Groups users into realtor companies
- **Teams**: Groups properties within an organization

```
User logs in via Google
    ↓
Better Auth creates session + account records
    ↓
hooks.server.ts extracts session on every request
    ↓
If no active organization, sets first available one
    ↓
locals.user and locals.session populated
```

### Session Flow (hooks.server.ts)

Every request passes through `hooks.server.ts`:

1. Calls `auth.api.getSession({ headers })`
2. If session exists but no `activeOrganizationId`, calls `setActiveOrganization` with first available org
3. Populates `locals.user` with decrypted user data
4. If no session, sets `locals.user = null`

**Important**: User names are encrypted at rest. The hook decrypts them when populating `locals.user`.

### Database Tables (Authentication)

| Table          | Purpose                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| `user`         | Core user data (id, email, encrypted name/surname/phone/document)                |
| `session`      | Active sessions (token, user_id, expires_at, activeOrganizationId, activeTeamId) |
| `account`      | OAuth provider links (google account_id → user_id)                               |
| `verification` | Email verification tokens                                                        |

## Authorization Layer

### The Two-Layer Model

Authorization happens in two distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Better Auth hasPermission()                        │
│   "Can this ROLE perform this ACTION TYPE?"                 │
│   Example: "Can managers write to properties?"              │
│   → Generic capability check, not instance-specific         │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: property_access ACL Table                          │
│   "Is this USER assigned to this specific PROPERTY?"        │
│   Example: "Is user #5 a manager for property #12?"         │
│   → Instance-specific assignment check                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```
┌─────────────────────────────────────────────────────────────┐
│ organization (= real estate company)                        │
│   ├── realtor role user (company owner)                     │
│   ├── manager role users (employees)                        │
│   └── teams:                                                │
│         ├── "Principal" (default, undeletable)              │
│         └── other teams for property grouping               │
│                                                             │
│ property                                                    │
│   └── realtor_id → which organization manages this          │
│                                                             │
│ property_access (ACL table)                                 │
│   ├── property_id → property                                │
│   ├── user_id → user                                        │
│   └── type: landlord (0) | manager (1) | tenant (2)         │
└─────────────────────────────────────────────────────────────┘
```

### Roles & Permissions

| Role       | Description               | Better Auth Permissions                                   |
| ---------- | ------------------------- | --------------------------------------------------------- |
| `realtor`  | Real estate company owner | Full org management + property/contract/tenant read/write |
| `manager`  | Property manager employee | Admin-level org + property/contract/tenant read/write     |
| `landlord` | Property owner            | Owner-level org + property/contract/tenant read/write     |
| `tenant`   | Current renter            | Property read, contract read only                         |

Defined in `src/lib/server/auth.ts` using Better Auth's access control.

### Access Types (property_access.type)

| Type       | Value | Description                              |
| ---------- | ----- | ---------------------------------------- |
| `LANDLORD` | 0     | User owns this property                  |
| `MANAGER`  | 1     | User is assigned to manage this property |
| `TENANT`   | 2     | User is renting this property            |

Defined in `src/lib/access_type.ts`.

### How Access Control Works

#### The require_property_access Function

Located in `src/lib/server/property_access.ts`:

```typescript
export async function require_property_access(
  headers: Headers,
  user_id: number,
  property_id: number,
  allowed_types: AccessType[],
) {
  // Layer 1: Role-based permission check (Better Auth)
  const permission = allowed_types.includes(
    ACCESS_TYPE.TENANT,
  )
    ? { property: ["read"] }
    : { property: ["write"] }

  const can_access = await auth.api.hasPermission({
    headers,
    body: { permissions: permission },
  })
  if (!can_access) error(403, "Forbidden")

  // Layer 2: Property-specific assignment check (ACL table)
  const access = await query_builder
    .selectFrom("property_access")
    .where("property_id", "=", property_id)
    .where("user_id", "=", user_id)
    .where("type", "in", allowed_types)
    .executeTakeFirst()

  if (!access) error(403, "Forbidden")
  return access
}
```

#### Convenience Wrappers

```typescript
require_view_access(headers, user_id, property_id) // landlord, manager, tenant
require_edit_access(headers, user_id, property_id) // landlord, manager
require_landlord_access(headers, user_id, property_id) // landlord only
```

#### Getting Accessible Property IDs

```typescript
// For listing pages - get all properties user can access
const property_ids = await get_accessible_property_ids(
  user_id,
  [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
)
```

### Database Tables (Authorization)

| Table             | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `organization`    | Real estate companies (id, name, slug)                                   |
| `member`          | Links users to organizations with roles (user_id, organization_id, role) |
| `team`            | Property groupings within an organization                                |
| `team_member`     | Links users to teams                                                     |
| `property_access` | **ACL table**: user-to-property assignments with type                    |
| `invitation`      | Pending organization invitations                                         |

### Query Patterns

#### Pattern 1: Listing properties for a user

```typescript
// Get property IDs from ACL table
const property_ids = await get_accessible_property_ids(
  user_id,
  [ACCESS_TYPE.MANAGER],
)

if (property_ids.length === 0) return []

// Fetch properties using those IDs
const properties = await query_builder
  .selectFrom("property")
  .where("id", "in", property_ids)
  .execute()
```

#### Pattern 2: Protecting a specific property route

```typescript
export const load: PageServerLoad = async ({
  locals,
  params,
  request,
}) => {
  if (!locals.user) redirect(302, "/auth/google")

  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )

  // Both layers checked in one call
  await require_edit_access(
    request.headers,
    locals.user.id,
    property_id,
  )

  // ... fetch data
}
```

## Common Scenarios

### Scenario 1: Realtor Creates Organization

1. User signs up, is invited as realtor to new organization
2. System creates "Principal" team automatically (via `organizationHooks.afterCreateOrganization`)
3. Realtor can now create properties and assign managers

```
Organization: "ABC Inmobiliaria"
    ├── Member: realtor@abc.com (realtor)
    └── Team: "Principal" (default)
```

### Scenario 2: Property with Landlord and Manager

1. Realtor creates property for a client
2. System creates `property_access` entries:
   - landlord_id → type: 0 (LANDLORD)
   - manager_id → type: 1 (MANAGER)

```
property_access:
    ├── property_id: 1, user_id: 5, type: 0 (landlord)
    └── property_id: 1, user_id: 2, type: 1 (manager)
```

### Scenario 3: Tenant Signs Contract

1. Manager creates contract for property
2. Tenant accepts invitation → added as org member with "tenant" role
3. System creates `property_access` entry:
   - tenant_id → type: 2 (TENANT)

```
property_access:
    ├── property_id: 1, user_id: 5, type: 0 (landlord)
    ├── property_id: 1, user_id: 2, type: 1 (manager)
    └── property_id: 1, user_id: 8, type: 2 (tenant)
```

### Scenario 4: Manager Views Their Properties

1. Manager logs in
2. `get_accessible_property_ids(user_id, [MANAGER])` queries ACL table
3. Returns only properties where they're assigned as manager

## Key Files Reference

| File                                | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| `src/lib/server/auth.ts`            | Better Auth configuration, roles, permissions, teams |
| `src/hooks.server.ts`               | Session extraction, active organization setup        |
| `src/lib/server/property_access.ts` | Two-layer access control functions                   |
| `src/lib/access_type.ts`            | Access type constants (LANDLORD, MANAGER, TENANT)    |
| `src/lib/server/encryption.ts`      | PII encryption (names, phone, document)              |

## Security Considerations

### PII Encryption

All personally identifiable information is encrypted at rest:

- `user.name`, `user.surname` (AES-256-GCM)
- `user.phone_number`, `user.document_number`

Encrypted on write (Google OAuth profile mapping), decrypted on read (hooks.server.ts, fetchers).

### Session Security

- Cookies: `sameSite: "none"`, `secure: true` (HTTPS required)
- 30-day expiration with 15-day rolling refresh
- `activeOrganizationId` stored in session for `hasPermission` calls

### Authorization Checks

**Always check both layers**:

1. User is authenticated (`if (!locals.user) redirect`)
2. User has role permission AND is assigned to specific property (`require_edit_access`)

```typescript
// Correct pattern in page loaders:
export const load = async ({ locals, params, request }) => {
  if (!locals.user) redirect(302, "/auth/google")
  await require_edit_access(
    request.headers,
    locals.user.id,
    params.property_id,
  )
  // ... fetch data
}
```

## Empty Array Guard

When fetching properties for a user with no assignments, `get_accessible_property_ids` returns `[]`. All fetchers must handle this:

```typescript
export async function fetch_properties(
  property_ids: number[],
) {
  if (property_ids.length === 0) return [] // Prevents SQL syntax error
  // ... query
}
```

PostgreSQL doesn't allow `WHERE id IN ()` with empty arrays.

## Active Organization Requirement

Better Auth's `hasPermission()` requires an active organization in the session. This is set automatically in `hooks.server.ts`:

```typescript
if (!session.session.activeOrganizationId) {
  const orgs = await auth.api.listOrganizations({ headers })
  if (orgs && orgs.length > 0) {
    await auth.api.setActiveOrganization({
      headers,
      body: { organizationId: orgs[0].id },
    })
  }
}
```

Without an active organization, `hasPermission()` will throw "No active organization".

## Testing Authorization

Use the seed data:

- User ID 2 → manager of seeded property (property_access type: 1)
- Organization created with user 2 as member
