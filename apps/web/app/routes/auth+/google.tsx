import { generateCodeVerifier, generateState } from "arctic"
import { redirect } from "react-router"
import {
  google_code_verifier_cookie,
  google_state_cookie,
} from "~/lib/cookies.server"
import { google } from "~/lib/google.server"

export async function action() {
  const state = generateState()
  const code_verifier = generateCodeVerifier()
  const url = google.createAuthorizationURL(
    state,
    code_verifier,
    ["openid", "profile", "email"],
  )

  const headers = new Headers()
  headers.append(
    "Set-Cookie",
    await google_state_cookie.serialize(state),
  )
  headers.append(
    "Set-Cookie",
    await google_code_verifier_cookie.serialize(
      code_verifier,
    ),
  )
  return redirect(url.toString(), { headers })
}
