import { error, redirect } from "@sveltejs/kit"
import { OAuth2RequestError } from "arctic"
import * as v from "valibot"
import type { RequestHandler } from "./$types"
import { query_builder } from "db/query_builder"
import { google } from "$lib/server/google"
import {
  create_session,
  generate_session_token,
} from "$lib/server/auth"
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  GOOGLE_STATE_COOKIE_NAME,
  GOOGLE_STATE_COOKIE_OPTIONS,
  GOOGLE_CODE_VERIFIER_COOKIE_NAME,
  GOOGLE_CODE_VERIFIER_COOKIE_OPTIONS,
} from "$lib/server/cookies"
import { encrypt } from "$lib/server/encryption"

const GoogleUserSchema = v.object({
  sub: v.string(),
  email: v.string(),
  name: v.string(),
  given_name: v.string(),
  family_name: v.string(),
  picture: v.string(),
  email_verified: v.boolean(),
})

export const GET: RequestHandler = async ({
  url,
  cookies,
}) => {
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const stored_state = cookies.get(GOOGLE_STATE_COOKIE_NAME)
  const stored_code_verifier = cookies.get(
    GOOGLE_CODE_VERIFIER_COOKIE_NAME,
  )

  if (
    !code ||
    !state ||
    !stored_state ||
    !stored_code_verifier ||
    state !== stored_state
  ) {
    error(400, "Invalid OAuth callback")
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      stored_code_verifier,
    )
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      },
    )
    const google_user = v.parse(
      GoogleUserSchema,
      await response.json(),
    )

    const existing_user = await query_builder
      .selectFrom("user")
      .selectAll()
      .where("email", "=", google_user.email)
      .executeTakeFirst()

    if (existing_user) {
      await create_session_and_set_cookies(
        existing_user.id,
        cookies,
      )
      redirect(302, "/properties")
    }

    const user = await query_builder
      .insertInto("user")
      .values({
        email: google_user.email,
        name: encrypt(google_user.given_name),
        surname: encrypt(google_user.family_name),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    await create_session_and_set_cookies(user.id, cookies)
    redirect(302, "/properties")
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      error(400, "Invalid OAuth request")
    }
    throw err
  }
}

async function create_session_and_set_cookies(
  user_id: number,
  cookies: Parameters<RequestHandler>[0]["cookies"],
) {
  const session_token = generate_session_token()
  await create_session(session_token, user_id)

  cookies.set(
    SESSION_COOKIE_NAME,
    session_token,
    SESSION_COOKIE_OPTIONS,
  )
  cookies.set(GOOGLE_STATE_COOKIE_NAME, "", {
    ...GOOGLE_STATE_COOKIE_OPTIONS,
    maxAge: 0,
  })
  cookies.set(GOOGLE_CODE_VERIFIER_COOKIE_NAME, "", {
    ...GOOGLE_CODE_VERIFIER_COOKIE_OPTIONS,
    maxAge: 0,
  })
}
