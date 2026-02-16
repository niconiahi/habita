# Authorization Roles vs Business Data Scoping

This document explains the fundamental distinction between **authorization** (permission to perform actions) and **data scoping** (which specific records a user can access). Getting this wrong leads to either security vulnerabilities or unmaintainable code.

---

## The Two Questions

Every data access in your application must answer two separate questions:

| Question          | Concern       | Tool                                  |
| ----------------- | ------------- | ------------------------------------- |
| **"CAN they?"**   | Authorization | Better Auth roles & `hasPermission()` |
| **"WHICH ones?"** | Data Scoping  | `property_access` ACL table queries   |

### Question 1: Authorization (Better Auth)

> "Is this user **allowed** to perform this action on this **type** of resource?"

This is a yes/no gate. Either they have permission or they don't.

```typescript
// Example: Can this user write to properties at all?
const allowed = await auth.api.hasPermission({
  headers,
  body: { permissions: { property: ["write"] } },
})

if (!allowed) {
  throw error(403, "Not authorized to write properties")
}
```

### Question 2: Data Scoping (ACL Table)

> "Which **specific instances** of this resource is this user assigned to?"

This filters the dataset based on explicit user-to-resource assignments.

```typescript
// Example: Which properties can this manager access?
const property_ids = await get_accessible_property_ids(
  user_id,
  [ACCESS_TYPE.MANAGER],
)
```

---

## The Two-Layer Heuristic

When implementing a feature, use this decision tree:

```
┌─────────────────────────────────────────────────────────────┐
│ "Should user X be able to do Y on resource Z?"              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ LAYER 1: Is this about the TYPE of action?                  │
│   → Better Auth hasPermission()                             │
│   → "Can managers write to properties?" → permission check  │
│                                                             │
│ LAYER 2: Is this about WHICH specific resources?            │
│   → property_access ACL table query                         │
│   → "Which properties can this manager access?" → ACL query │
│                                                             │
│ BOTH layers must pass for access to be granted.             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## The property_access ACL Table

User-to-property relationships are stored in the `property_access` table:

| Column        | Type    | Description                                  |
| ------------- | ------- | -------------------------------------------- |
| `property_id` | integer | The property being accessed                  |
| `user_id`     | integer | The user with access                         |
| `type`        | integer | Access type: 0=landlord, 1=manager, 2=tenant |
| `granted_by`  | integer | Who granted this access (audit trail)        |

This table answers the question: "Is this specific user assigned to this specific property, and in what capacity?"

### Access Types

| Type       | Value | Meaning                                  |
| ---------- | ----- | ---------------------------------------- |
| `LANDLORD` | 0     | User owns this property                  |
| `MANAGER`  | 1     | User is assigned to manage this property |
| `TENANT`   | 2     | User is renting this property            |

---

## The Complete Pattern

Every protected data access should follow this two-layer pattern:

```typescript
async function require_property_access(
  headers: Headers,
  user_id: number,
  property_id: number,
  allowed_types: AccessType[],
) {
  // ═══════════════════════════════════════════════════════════
  // LAYER 1: AUTHORIZATION - "CAN they perform this action type?"
  // ═══════════════════════════════════════════════════════════
  const permission = allowed_types.includes(
    ACCESS_TYPE.TENANT,
  )
    ? { property: ["read"] }
    : { property: ["write"] }

  const can_access = await auth.api.hasPermission({
    headers,
    body: { permissions: permission },
  })

  if (!can_access) {
    error(403, "Role does not have permission")
  }

  // ═══════════════════════════════════════════════════════════
  // LAYER 2: DATA SCOPING - "Is user assigned to THIS property?"
  // ═══════════════════════════════════════════════════════════
  const access = await query_builder
    .selectFrom("property_access")
    .where("property_id", "=", property_id)
    .where("user_id", "=", user_id)
    .where("type", "in", allowed_types)
    .executeTakeFirst()

  if (!access) {
    error(403, "Not assigned to this property")
  }

  return access
}
```

---

## Better Auth Role Definitions

Roles define **what actions are permitted**, not which records are accessible.

```typescript
// In auth.ts
const statement = {
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
} as const

const landlord = ac.newRole({
  ...ownerAc.statements, // Full org management
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
})

const manager = ac.newRole({
  ...adminAc.statements, // Admin-level org management
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
})

const tenant = ac.newRole({
  property: ["read"], // Can only read
  contract: ["read"], // Can only read
  // No write permissions
})
```

**Key insight**: `landlord` and `manager` have **identical resource permissions** (`property: ["read", "write"]`). The difference in what specific properties they can access comes from **data scoping** (the ACL table), not permissions.

---

## Common Mistakes

### Mistake 1: Encoding instance-specific logic in permissions

```typescript
// WRONG - doesn't scale, impossible to maintain
const managerOfProperty123 = ac.newRole({
  property123: ["write"],
  property456: ["write"],
})
```

Permissions should be generic (`property: ["write"]`), not instance-specific. Use the ACL table for instance-level access.

### Mistake 2: Skipping Layer 1, relying only on data scoping

```typescript
// WRONG - no permission check
async function getProperties(userId: number) {
  const property_ids = await get_accessible_property_ids(
    userId,
    [ACCESS_TYPE.MANAGER],
  )
  return query_builder
    .selectFrom("property")
    .where("id", "in", property_ids)
    .execute()
}
```

**Problem**: What if their role was revoked? What if they're not even supposed to access properties anymore? The ACL query would still return results if the `property_access` entries exist.

Always check permissions first, then scope data.

### Mistake 3: Checking roles in SQL instead of using Better Auth

```typescript
// WRONG - duplicating auth logic in queries
const properties = await query_builder
  .selectFrom("property_access")
  .innerJoin(
    "member",
    "member.user_id",
    "property_access.user_id",
  )
  .where("member.role", "=", "manager") // Auth logic leaked into SQL
  .execute()
```

Use Better Auth's `hasPermission()` for permission checks. Use SQL only for data scoping (querying the ACL table for assignments).

### Mistake 4: Using member.role for data scoping

```typescript
// WRONG - mixing role checks with data scoping
const access = await query_builder
  .selectFrom("member")
  .where("member.user_id", "=", user_id)
  .where("member.role", "in", ["manager", "landlord"])
  .execute()
```

The `member` table stores organization membership roles. Use the `property_access` table for property-level data scoping.

---

## Summary Table

| Concern         | Where it Lives                | How to Check               | Example                                                 |
| --------------- | ----------------------------- | -------------------------- | ------------------------------------------------------- |
| **Permission**  | Better Auth role definition   | `auth.api.hasPermission()` | "Can managers write properties?"                        |
| **Assignment**  | `property_access` ACL table   | SQL query on ACL table     | "Which properties is this user assigned to?"            |
| **Access Type** | `property_access.type` column | ACL query with type filter | "Is this user a landlord or manager for this property?" |

---

## Quick Reference

When writing a loader or action:

1. **First**: Check if the user has permission for the action type (Layer 1)

   ```typescript
   await auth.api.hasPermission({
     headers,
     body: { permissions: { resource: ["action"] } },
   })
   ```

2. **Then**: Check if user is assigned to the specific resource (Layer 2)

   ```typescript
   await query_builder
     .selectFrom("property_access")
     .where("property_id", "=", property_id)
     .where("user_id", "=", user_id)
     .where("type", "in", allowed_types)
     .executeTakeFirst()
   ```

3. **Or use the helper**: The `require_property_access` function does both layers

   ```typescript
   await require_edit_access(headers, user_id, property_id)
   ```

4. **Never**: Skip Layer 1 and assume Layer 2 is sufficient security

---

## Why Two Layers?

### Layer 1 alone is not enough

If you only check `hasPermission({ property: ["write"] })`, you're saying "this role can write to properties" but not "this user is assigned to this specific property". A manager could edit ANY property.

### Layer 2 alone is not enough

If you only check the ACL table, a user whose role was downgraded (e.g., manager → tenant) might still have `property_access` entries with `type: MANAGER`. The role check catches this.

### Together they provide defense-in-depth

1. Layer 1 verifies the user's current role has the capability
2. Layer 2 verifies the user is actually assigned to the specific resource

This separation also makes the system more maintainable:

- Changing what a role can do? Update Better Auth config.
- Changing which properties a user manages? Update the ACL table.
