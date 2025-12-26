import type { Handle } from "@sveltejs/kit"
import { validate_session_token } from "$lib/server/auth"
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "$lib/server/cookies"

export const handle: Handle = async ({
  event,
  resolve,
}) => {
  const session_token = event.cookies.get(
    SESSION_COOKIE_NAME,
  )

  if (!session_token) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } =
    await validate_session_token(session_token)

  if (session) {
    event.cookies.set(
      SESSION_COOKIE_NAME,
      session_token,
      SESSION_COOKIE_OPTIONS,
    )
  }

  event.locals.user = user
  event.locals.session = session

  return resolve(event)
}
