# Signup as Freelance

## Scenario

A new user visits the platform and creates an account via email/password. After signing up, they land on the onboarding page where they choose their account type. They select "Freelance" — meaning they manage rental properties independently, without belonging to a real estate agency. This redirects them to `/admin/properties`, their empty dashboard where they can start adding properties.

## Technical Details

### Preconditions

- No pre-existing user with the test email (a unique timestamped email is generated per run)
- No authenticated session required — this tests the unauthenticated → authenticated transition

### Actors

| Role            | Auth state file | Description                              |
| --------------- | --------------- | ---------------------------------------- |
| New user (anon) | None            | Signs up and becomes a freelance manager |

### Step-by-step Flow

1. **Signs up and chooses freelance** — Fills name, surname, email, password on `/signup`, submits → redirected to `/onboarding` → clicks "Freelance" card → redirected to `/admin/properties`
2. **Verifies user in database** — Confirms the user record was created by querying the DB with the test email

### Key Assertions

- After signup, user is redirected to `/onboarding`
- After choosing "Freelance", user is redirected to `/admin/properties`
- User record exists in the database with the test email

### Related Pages

- `/signup` — Account creation form
- `/onboarding` — Account type selection (Freelance vs Inmobiliaria)
- `/admin/properties` — Manager dashboard (landing page after freelance onboarding)
