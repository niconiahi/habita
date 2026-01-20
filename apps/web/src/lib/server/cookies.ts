const SECURE = process.env.NODE_ENV === "production"

export const SESSION_COOKIE_NAME = "auth-session"
export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: SECURE,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

export const GOOGLE_STATE_COOKIE_NAME = "google_oauth_state"
export const GOOGLE_STATE_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: SECURE,
  sameSite: "lax" as const,
  maxAge: 600, // 10 minutes
}

export const GOOGLE_CODE_VERIFIER_COOKIE_NAME =
  "google_code_verifier"
export const GOOGLE_CODE_VERIFIER_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: SECURE,
  sameSite: "lax" as const,
  maxAge: 600, // 10 minutes
}
