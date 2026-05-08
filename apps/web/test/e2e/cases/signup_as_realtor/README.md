# Signup as Realtor

## Scenario

A new user visits the platform and creates an account via email/password. After signing up, they land on the onboarding page where they choose their account type. They select "Inmobiliaria" — meaning they manage rental properties as part of a real estate agency with a team. This redirects them to `/demo` where they can request a demo to learn how the realtor account works. They submit the demo request and see a confirmation message

## Technical Details

### Preconditions

- No pre-existing user with the test email (a unique timestamped email is generated per run)
- No authenticated session required — this tests the unauthenticated → authenticated transition

### Actors

| Role            | Auth state file | Description                                   |
| --------------- | --------------- | --------------------------------------------- |
| New user (anon) | None            | Signs up and becomes a realtor account holder |

### Step-by-step Flow

1. **Signs up and chooses realtor** — Fills name, surname, email, password on `/signup`, submits → redirected to `/onboarding` → clicks "Inmobiliaria" card → redirected to `/demo`
2. **Requests a demo** — Logs in again (new browser context), navigates to `/demo`, clicks "Que me contacten por email" → sees confirmation message
3. **Verifies user in database** — Confirms the user record was created by querying the DB with the test email

### Key Assertions

- After signup, user is redirected to `/onboarding`
- After choosing "Inmobiliaria", user is redirected to `/demo`
- Demo request shows success message "Te vamos a contactar"
- User record exists in the database with the test email

### Related Pages

- `/signup` — Account creation form
- `/onboarding` — Account type selection (Freelance vs Inmobiliaria)
- `/demo` — Demo request page for realtor accounts
