# /properties/[property_id]/accept-invite

## Endpoint (`+server.ts` — GET only)
Server-side handler, no page. Validates:
1. User is authenticated (redirects to `/auth/google` otherwise)
2. `token` query param exists (validated with `v.parse(v.string(), ...)`)
3. `property_id` param parsed via `ForceNumberSchema`
4. Token hash matches an `invitation_token` record
5. Token's `property_id` matches the URL param
6. Token is not expired (`expires_at > now`)
7. Token has not been used (`used_at` is null)
8. User email matches invitation email (after stripping email subaddresses via `strip_email_subaddress()`)
9. Property exists

On success:
- Calls `assign_property_access(property_id, user_id, ACCESS_TYPE.LANDLORD)`
- Marks token as used (`used_at = now`)
- Logs the event
- Redirects to `/properties/{property_id}`

## Auth
Requires authenticated user. Email must match the invitation.
