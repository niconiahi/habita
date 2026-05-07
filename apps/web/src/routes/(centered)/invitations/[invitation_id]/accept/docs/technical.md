# /invitations/[invitation_id]/accept

## Loader

GET-driven side-effect route. The loader does the work — there are no actions.

1. **No session** → `redirect(302, /login?redirect_to=/invitations/{id}/accept)`. The login page (`(centered)/login/+page.svelte`) reads `redirect_to` from `searchParams` and routes back here after auth.
2. **Read invitation** via `query_builder` — Better Auth owns the row, but we read directly to branch on status without round-tripping through the API.
3. **Branch on status / state** (returns one of `not_found | expired | canceled | rejected | mismatch | error`, or redirects):
   - `accepted` → `redirect(303, /admin/teams/{team_id})` — idempotent re-click of an already-accepted invite lands on the team.
   - `canceled` / `rejected` → render friendly page (no DB write).
   - `expires_at <= now()` → render expired page.
   - `email !== locals.user.email` → render mismatch page naming the invited address.
   - Otherwise → `auth.api.acceptInvitation` then `auth.api.setActiveOrganization`, then `redirect(303, /admin/teams/{team_id})`.

The "no `query_builder` writes to `invitation`" invariant holds — reads only.

## Actions

None. All transitions happen on GET via the load function.

## Auth

Requires authenticated user. The invited email and the logged-in email must match for membership to be granted; otherwise the page renders the mismatch state and never touches Better Auth.

## Key components

- Status-aware `+page.svelte` switching on `data.state` — single component covers all friendly states.
- `Button` for the "Iniciar sesión" CTA on the mismatch page.
- Lives under `(centered)` so it picks up the marketing/auth layout (Header, Footer, centered container).

## Notes

- `setActiveOrganization` is called explicitly because Better Auth does not switch active org on accept.
- If `team_id` is null (org-level invite, not a team invite), redirects to `/admin/teams`. Current realtor flow always sets `team_id`, but the loader stays defensive.
- Auto-accept on first login (handled in `lib/server/auto_accept_pending_invitations.ts`) is a parallel path: if the invitee signs up before clicking the link, they're already a team member by the time they'd hit this route — the loader sees `status='accepted'` and redirects to the team.
