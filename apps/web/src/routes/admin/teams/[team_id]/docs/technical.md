# /admin/teams/[team_id]

## Loader

Requires auth. Calls `require_active_realtor_organization(activeOrganizationId, subscriptions)` — 403s unless the user owns a `REALTOR` subscription for the **active** organization. Then:

- Loads the team via `fetch_team(team_id, organization_id)`. The `organization_id` (active org) filter is the security boundary — it guarantees a realtor can only view their own org's teams. Returns 404 on miss.
- Loads members via `fetch_team_members_with_property_counts(team_id)` — joins `team_member` with `user` and aggregates `property_access` (where `type = MANAGER`) for the property count column.
- Loads pending invitations via `fetch_pending_team_invitations(team_id)` — `WHERE team_id = ? AND status = 'pending' AND expires_at > now()`.

## Actions

- `INVITE_TO_TEAM` — calls `auth.api.createInvitation({ email, organizationId, teamId, role: "manager" })`. Better Auth fires the `sendInvitationEmail` hook (registered in `lib/server/auth.ts`), which publishes to the `send_team_invite` Kafka topic. Returns `{ success: true }` on success for the inline confirmation banner.
- `REMOVE_FROM_TEAM` — deletes the `team_member` row. **Blocked** if the user has any `property_access (type=MANAGER)` rows: returns `fail(400)` with a message asking to reassign first. Org membership and property access are intentionally untouched.
- `UPDATE_TEAM_NAME` — updates `team.name` (1–50 chars, trimmed). Returns `fail(400)` with field errors or a generic message on DB failure.
- `CANCEL_INVITATION` — validates `invitation_id` belongs to the active realtor org's team. Branches on current `status`: `accepted`/`canceled`/`rejected` return state-specific Spanish `fail(400)` messages; `pending` calls `auth.api.cancelInvitation`. No silent no-ops.
- `DESTROY_TEAM` — **Blocked** if any `team_member` row exists for the team (prevents orphaned property assignments). When unblocked: loads pending invitations and calls `auth.api.cancelInvitation` for each, then deletes the team row, then `redirect(303, "/admin/teams")`.

All actions re-verify the active-org realtor scope and that the team belongs to that org. All actions that touch invitations forward `request.headers` to Better Auth so it can read session cookies.

## Invariant

**No `query_builder` writes touch `invitation`.** Reads are fine (status branching, pending lists). All mutations go through `auth.api.{createInvitation,acceptInvitation,cancelInvitation}`. The accept route at `/invitations/[invitation_id]/accept` follows the same rule.

## Auth

Requires authenticated user who owns a `REALTOR` subscription for the **active** organization, and the team must belong to that active organization. Returns 403/404 otherwise.

## Key components

- `<div class="page">` + `<div class="header">` + `<h1 class="heading-md title">` mirroring `/admin/properties` (title aligned with header actions: `Editar nombre`, `Invitar al equipo`, `Eliminar equipo`).
- `Breadcrumb` for navigation back to `/admin/teams`.
- Three `Dialog` modals: invite, edit name, destroy. The destroy modal branches on `data.members.length` — blocked state shows only `Cancelar`; confirmable state shows `Cancelar` + `Eliminar` with the standard "no se puede deshacer" copy.
- A `<section>` "Invitaciones pendientes" between the header and the members table — separate `Table` so the affordances stay honest (Cancelar invitación vs. Remover member). Renders only when `data.pending_invitations.length > 0`.
- A `success-banner` `<p>` shown when the invite action returns `{ success: true }` ("Invitación enviada"). Replaces the absence of a global toast component.
- `Table` for the members list (plain `<a>` tags pick up global link styling).
- `Formulary` for the modal form fields.

## Data model notes

- "Properties of a member" is computed via `property_access (user_id, type=MANAGER)`. There is no direct `property.team_id` lookup in this loader — the chain is property → manager → team.
- The `invitation.team_id` column was added in migration `1778089630640_add_team_id_to_invitation` (nullable so existing org-level invitations still work).
