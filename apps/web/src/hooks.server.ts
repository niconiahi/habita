import type { Handle } from "@sveltejs/kit"
import { auth } from "$lib/server/auth"
import { svelteKitHandler } from "better-auth/svelte-kit"
import { building } from "$app/environment"
import { decrypt } from "$lib/server/encryption"

export const handle: Handle = async ({
  event,
  resolve,
}) => {
  let session = await auth.api.getSession({
    headers: event.request.headers,
  })
  if (!session) {
    event.locals.user = null
    event.locals.session = null
    return svelteKitHandler({
      event,
      resolve,
      auth,
      building,
    })
  }
  const active_organization_id = session.session.activeOrganizationId
  event.locals.user = {
    id: Number(session.user.id),
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
    userId: Number(session.session.userId),
    expiresAt: session.session.expiresAt,
    createdAt: session.session.createdAt,
    updatedAt: session.session.updatedAt,
  }
  if (!active_organization_id) {
    const organizations = await auth.api.listOrganizations({
      headers: event.request.headers,
    })
    if (organizations && organizations.length > 0) {
      await auth.api.setActiveOrganization({
        headers: event.request.headers,
        body: { organizationId: organizations[0].id },
      })
      session = await auth.api.getSession({
        headers: event.request.headers,
      })
    }
  }
  return svelteKitHandler({
    event,
    resolve,
    auth,
    building,
  })
}
