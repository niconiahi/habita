import { redirect } from "@sveltejs/kit"
import { generateCodeVerifier, generateState } from "arctic"
import type { RequestHandler } from "./$types"
import { google } from "$lib/server/google"
import {
  GOOGLE_STATE_COOKIE_NAME,
  GOOGLE_STATE_COOKIE_OPTIONS,
  GOOGLE_CODE_VERIFIER_COOKIE_NAME,
  GOOGLE_CODE_VERIFIER_COOKIE_OPTIONS,
} from "$lib/server/cookies"

export const POST: RequestHandler = async ({ cookies }) => {
  const state = generateState()
  const code_verifier = generateCodeVerifier()
  const url = google.createAuthorizationURL(
    state,
    code_verifier,
    ["openid", "profile", "email"],
  )

  cookies.set(
    GOOGLE_STATE_COOKIE_NAME,
    state,
    GOOGLE_STATE_COOKIE_OPTIONS,
  )
  cookies.set(
    GOOGLE_CODE_VERIFIER_COOKIE_NAME,
    code_verifier,
    GOOGLE_CODE_VERIFIER_COOKIE_OPTIONS,
  )

  redirect(302, url.toString())
}
