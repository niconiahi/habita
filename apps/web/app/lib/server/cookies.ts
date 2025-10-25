import { createCookie } from "react-router"

export const google_state_cookie = createCookie(
  "google_oauth_state",
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  },
)

export const google_code_verifier_cookie = createCookie(
  "google_code_verifier",
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  },
)
