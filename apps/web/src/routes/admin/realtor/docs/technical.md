# /admin/realtor (retired)

Permanent redirect (308) to `/admin/teams`. No loader logic, no actions, no UI.

The previous implementation (loader + invite/remove/reassign actions) was deleted and equivalent functionality lives at:

- `/admin/teams` — list teams, create team
- `/admin/teams/[team_id]` — invite to team, remove from team
- `/admin/teams/[team_id]/members/[user_id]` — view managed properties, reassign property

The redirect uses 308 (permanent) so caches and search engines update the canonical URL.
