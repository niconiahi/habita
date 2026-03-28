import type { Handle } from "@sveltejs/kit"
import { svelteKitHandler } from "better-auth/svelte-kit"
import { building } from "$app/environment"
import { auth } from "$lib/server/auth"
import { decrypt } from "$lib/server/encryption"
import { fetch_user_subscriptions } from "$lib/server/subscription"

export const handle: Handle = async ({
  event,
  resolve,
}) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  })
  if (!session) {
    event.locals.user = null
    event.locals.session = null
    event.locals.subscriptions = []
    return svelteKitHandler({
      event,
      resolve,
      auth,
      building,
    })
  }
  const user_id = Number(session.user.id)
  event.locals.user = {
    id: user_id,
    email: session.user.email,
    name: session.user.name
      ? decrypt(session.user.name)
      : null,
    surname: session.user.surname
      ? decrypt(session.user.surname)
      : null,
  }
  event.locals.session = {
    id: session.session.id,
    userId: user_id,
    expiresAt: session.session.expiresAt,
    createdAt: session.session.createdAt,
    updatedAt: session.session.updatedAt,
    activeOrganizationId:
      session.session.activeOrganizationId ?? null,
  }
  event.locals.subscriptions =
    await fetch_user_subscriptions(user_id)
  return svelteKitHandler({
    event,
    resolve,
    auth,
    building,
  })
}
