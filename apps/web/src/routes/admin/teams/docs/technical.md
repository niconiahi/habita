# /admin/teams

## Loader

Requires auth. Calls `require_active_realtor_organization(activeOrganizationId, subscriptions)` — 403s unless the user owns a `REALTOR` subscription for the **active** organization (`subscriptions` is already scoped to the user, so the type check on the active org is sufficient). Loads:

- `teams` — every `team` row for the active realtor organization, with a `member_count` aggregate from `team_member`. Sorted by `created_at` ascending so the default "Ejemplo" team stays at the top.

## Actions

- `CREATE_TEAM` — inserts a new `team` row scoped to the realtor org. Validates `name` (1–50 chars). Returns `fail(400)` with field errors or a generic message on DB failure.

## Auth

Requires authenticated user who owns a `REALTOR` subscription for the **active** organization. The active-org check is the security boundary — switching to another org (e.g. "Personal") immediately 403s on this route.

## Data model

Teams live under Better Auth's organization plugin. Schema is `team(id, name, organization_id, created_at, updated_at)`. Membership is `team_member(id, team_id, user_id, created_at)`. Property assignments are not stored on the team — they're inferred via the chain `property → property_access (type=MANAGER) → user → team_member → team`.

## Key components

- `<div class="page">` + `<div class="header">` + `<h1 class="heading-md title">` mirroring `/admin/properties` (title aligned with "Crear equipo" CTA).
- `Dialog` for the create-team modal.
- `Table` for the team list (plain `<a>` tags pick up global link styling).
- `Formulary` for the modal form fields.
