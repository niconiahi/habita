# Authorization & Authentication System

## Overview

Habita uses **Better Auth** for authentication and a custom **organization-based authorization** model for access control. The system supports Google OAuth login and manages property access through organization memberships.

## Authentication Layer

### Better Auth Configuration

Located at `src/lib/server/auth.ts`, Better Auth handles:

- **Session Management**: 30-day sessions with 15-day rolling refresh
- **Google OAuth**: Primary login method via `socialProviders.google`
- **Database Integration**: Direct PostgreSQL connection via `pg` Pool

```
User logs in via Google
    ↓
Better Auth creates session + account records
    ↓
hooks.server.ts extracts session on every request
    ↓
locals.user and locals.session populated
```

### Session Flow (hooks.server.ts)

Every request passes through `hooks.server.ts`:

1. Calls `auth.api.getSession({ headers })`
2. If session exists, populates `locals.user` with decrypted user data
3. If no session, sets `locals.user = null`

**Important**: User names are encrypted at rest. The hook decrypts them when populating `locals.user`.

### Database Tables (Authentication)

| Table | Purpose |
|-------|---------|
| `user` | Core user data (id, email, encrypted name/surname/phone/document) |
| `session` | Active sessions (token, user_id, expires_at, ip_address, user_agent) |
| `account` | OAuth provider links (google account_id → user_id) |
| `verification` | Email verification tokens (not currently used) |

## Authorization Layer

### The Organization Model

Authorization is **property-centric** but managed through **organizations**:

```
Organization (manages properties)
    ├── Member (user_id + role)
    │       └── landlord | realtor | admin | tenant
    └── Property (organization_id FK)
            └── Contracts, Slots, etc.
```

**Key insight**: A property belongs to exactly ONE organization. An organization can manage MANY properties.

### Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| `landlord` | Property owner | Full access to their property |
| `realtor` | Real estate company | Manages multiple properties for clients |
| `admin` | Property administrator | Manages property on behalf of landlord |
| `tenant` | Current renter | Read-only access to their rental |

Defined in `src/lib/organization_role.ts` and configured in Better Auth's access control.

### How Access Control Works

#### 1. Listing Properties (get_edit_property_ids)

Located in `src/lib/server/organizations.ts`:

```typescript
export async function get_edit_property_ids(user_id: number) {
  // Find all organizations where user is landlord, admin, or realtor
  // Return all property IDs from those organizations
}
```

This is used by admin pages to show only properties the user can manage.

#### 2. Checking Specific Property Access (has_property_role)

```typescript
export async function has_property_role(
  user_id: number,
  property_id: number,
  roles: OrganizationRole[],
) {
  // Join: member → property (via organization_id)
  // Check if user has any of the specified roles for this property's org
}
```

#### 3. Route Protection (property_access.ts)

Helper functions for common access patterns:

```typescript
require_view_access(user_id, property_id)   // landlord, admin, tenant
require_edit_access(user_id, property_id)   // landlord, admin
require_landlord_access(user_id, property_id) // landlord only
```

These throw `error(403, "Forbidden")` if access is denied.

### Database Tables (Authorization)

| Table | Purpose |
|-------|---------|
| `organization` | Groups that manage properties (id, name, slug, logo) |
| `member` | Links users to organizations with roles (user_id, organization_id, role) |
| `property.organization_id` | Which organization manages this property |
| `invitation` | Pending organization invitations |

### Query Pattern

Every authorization query follows this join pattern:

```sql
SELECT ... FROM member
INNER JOIN property ON property.organization_id = member.organization_id
WHERE member.user_id = ? AND member.role IN (?)
```

## Common Scenarios

### Scenario 1: Solo Landlord

1. Landlord creates property
2. System creates organization: "Property: [address]"
3. System creates member: landlord → organization
4. Property linked to organization

```
Organization: "Property: Padilla 1180"
    └── Member: nicolas@gmail.com (admin)
            └── Property: id=1
```

### Scenario 2: Realtor Managing Multiple Properties

1. Realtor has an organization: "ABC Inmobiliaria"
2. Creates properties → all linked to their org
3. Can add admin employees to org
4. Admins see all org properties

```
Organization: "ABC Inmobiliaria"
    ├── Member: realtor@abc.com (realtor)
    ├── Member: employee@abc.com (admin)
    ├── Property: id=1
    ├── Property: id=2
    └── Property: id=3
```

### Scenario 3: Adding a Tenant

1. Admin creates contract for property
2. Invites tenant via email
3. Tenant accepts invite → added as member with role "tenant"
4. Tenant can view their rental property

```
Organization: "Property: Padilla 1180"
    ├── Member: admin@gmail.com (admin)
    └── Member: tenant@gmail.com (tenant)
            └── Property: id=1
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/server/auth.ts` | Better Auth configuration, roles, access control |
| `src/hooks.server.ts` | Session extraction, populates `locals.user` |
| `src/lib/server/organizations.ts` | All organization/member queries |
| `src/lib/server/property_access.ts` | Route protection helpers |
| `src/lib/organization_role.ts` | Role constants and labels |
| `src/lib/server/encryption.ts` | PII encryption (names, phone, document) |

## Security Considerations

### PII Encryption

All personally identifiable information is encrypted at rest:
- `user.name`, `user.surname` (AES-256-GCM)
- `user.phone_number`, `user.document_number`

Encrypted on write (Google OAuth profile mapping), decrypted on read (hooks.server.ts, fetchers).

### Session Security

- Cookies: `sameSite: "none"`, `secure: true` (HTTPS required)
- 30-day expiration with 15-day rolling refresh
- Session token stored in `session.token` column

### Authorization Checks

**Always verify both**:
1. User is authenticated (`if (!locals.user) redirect`)
2. User has role for specific property (`require_edit_access`)

```typescript
// Correct pattern in page loaders:
export const load = async ({ locals, params }) => {
  if (!locals.user) redirect(302, "/auth/google")
  await require_edit_access(locals.user.id, params.property_id)
  // ... fetch data
}
```

## Empty Array Guard

When fetching properties for a user with no memberships, `get_edit_property_ids` returns `[]`. All fetchers must handle this:

```typescript
export async function fetch_properties(property_ids: number[]) {
  if (property_ids.length === 0) return []  // Prevents SQL syntax error
  // ... query
}
```

PostgreSQL doesn't allow `WHERE id IN ()` with empty arrays.

## Adding New Roles

1. Add to `ORGANIZATION_ROLE` in `src/lib/organization_role.ts`
2. Add role definition in `src/lib/server/auth.ts` using `ac.newRole()`
3. Add to Better Auth's organization plugin `roles` config
4. Update `OrganizationRole` type in `organizations.ts`
5. Update access check functions in `property_access.ts` if needed

## Testing Authorization

Use the seed data:
- `nicolas.accetta@gmail.com` → admin of seeded property
- `nicolas.accetta+owner@gmail.com` → landlord role available
- `nicolas.accetta+tenant@gmail.com` → tenant role available
