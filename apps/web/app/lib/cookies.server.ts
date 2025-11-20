import { createCookie } from "react-router"

if (!process.env.NODE_ENV)
  throw new Error("NODE_ENV is not set")

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

export function get_mercado_pago_verifier_cookie() {
  return createCookie("mercado_pago_verifier", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })
}

export function get_mercado_pago_state_cookie() {
  return createCookie("mercado_pago_state", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })
}

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
