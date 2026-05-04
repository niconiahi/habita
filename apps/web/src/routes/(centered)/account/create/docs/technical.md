# /onboarding

## Loader

Redirects to `/login` if not authenticated.

## Actions

- `SELECT_ACCOUNT_TYPE` — receives `type` (from `SUBSCRIPTION_TYPE`: `FREELANCE` or `REALTOR`) via hidden input. Calls `select_account_type()` which creates the organization and subscription, then redirects to the path returned in `data.redirect_path`.

## Auth

Requires authenticated user (`locals.user`).

## Key Components

Content, Formulary (for the freelance/realtor cards that submit forms)

## Notes

- Tenant card is just a link to `/profile` (no form submission)
- Freelance and Realtor cards submit the `SELECT_ACCOUNT_TYPE` action with their respective type
