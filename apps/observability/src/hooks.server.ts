import type { Handle } from "@sveltejs/kit"
import { svelteKitHandler } from "better-auth/svelte-kit"
import { building } from "$app/environment"
import { auth } from "$lib/server/auth"

export const handle: Handle = async ({
  event,
  resolve,
}) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  })

  if (session) {
    event.locals.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }
    event.locals.session = {
      id: session.session.id,
    }
  } else {
    event.locals.user = null
    event.locals.session = null
  }

  return svelteKitHandler({
    event,
    resolve,
    auth,
    building,
  })
}
