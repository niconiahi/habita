# /admin/teams

## Loader

Requires auth. Checks `get_user_realtor_organization()` — returns 403 if the user isn't a realtor. Loads:

- `organization` — the user's realtor organization (id, name, slug, logo).
- `teams` — every `team` row for that organization, with a `member_count` aggregate from `team_member`. Sorted by `created_at` ascending so the default "Ejemplo" team stays at the top.

## Actions

- `CREATE_TEAM` — inserts a new `team` row scoped to the realtor org. Validates `name` (1–50 chars). Returns `fail(400)` with field errors or a generic message on DB failure.

## Auth

Requires authenticated user who owns a realtor organization. Returns 403 otherwise.

## Data model

Teams live under Better Auth's organization plugin. Schema is `team(id, name, organization_id, created_at, updated_at)`. Membership is `team_member(id, team_id, user_id, created_at)`. Property assignments are not stored on the team — they're inferred via the chain `property → property_access (type=MANAGER) → user → team_member → team`.

## Key components

- `Content` / `Section` for layout.
- `Table` for the team list.
- `Formulary` for the inline create form.
