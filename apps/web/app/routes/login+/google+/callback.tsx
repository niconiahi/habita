import { OAuth2RequestError } from "arctic"
import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import * as v from "valibot"
import { query_builder } from "db/query_builder"
import {
  create_session,
  generate_session_token,
} from "~/lib/server/auth.server"
import {
  google_code_verifier_cookie,
  google_state_cookie,
} from "~/lib/server/cookies.server"
import { google } from "~/lib/server/google.server"
import { session_cookie } from "~/lib/server/session.server"

const GoogleUserSchema = v.object({
  sub: v.string(),
  email: v.string(),
  name: v.string(),
  given_name: v.string(),
  family_name: v.string(),
  picture: v.string(),
  email_verified: v.boolean(),
})

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const cookie_header = request.headers.get("Cookie")
  const stored_state =
    await google_state_cookie.parse(cookie_header)
  const stored_code_verifier =
    await google_code_verifier_cookie.parse(cookie_header)

  if (
    !code ||
    !state ||
    !stored_state ||
    !stored_code_verifier ||
    state !== stored_state
  ) {
    throw new Response("Invalid OAuth callback", {
      status: 400,
    })
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
      return await create_session_and_redirect(
        existing_user.id,
      )
    }

    const user = await query_builder
      .insertInto("user")
      .values({
        email: google_user.email,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    return await create_session_and_redirect(user.id)
  } catch (error) {
    if (error instanceof OAuth2RequestError) {
      throw new Response("Invalid OAuth request", {
        status: 400,
      })
    }
    throw new Response("Internal server error", {
      status: 500,
    })
  }
}

async function create_session_and_redirect(
  user_id: number,
) {
  const session_token = generate_session_token()
  await create_session(session_token, user_id)

  const headers = new Headers()
  headers.append(
    "Set-Cookie",
    await session_cookie.serialize(session_token),
  )
  headers.append(
    "Set-Cookie",
    await google_state_cookie.serialize("", { maxAge: 0 }),
  )
  headers.append(
    "Set-Cookie",
    await google_code_verifier_cookie.serialize("", {
      maxAge: 0,
    }),
  )

  console.log("after headers")
  return redirect("/", { headers })
}
