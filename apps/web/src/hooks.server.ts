import {
  error,
  type Handle,
  type ServerInit,
} from "@sveltejs/kit"
import { svelteKitHandler } from "better-auth/svelte-kit"
import { building } from "$app/environment"
import { auth } from "$lib/server/auth"
import { auto_accept_pending_invitations } from "$lib/server/auto_accept_pending_invitations"
import { decrypt } from "$lib/server/encryption"
import { ensure_bucket } from "$lib/server/object_store"
import { is_rate_limited } from "$lib/server/rate_limit"
import { fetch_user_subscriptions_cached } from "$lib/server/subscription"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"

export const init: ServerInit = async () => {
  await ensure_bucket()
}

export const handle: Handle = async ({
  event,
  resolve,
}) => {
  if (await is_rate_limited(event)) {
    error(429, "too many requests")
  }

  let session = await auth.api.getSession({
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
  const { accepted } =
    await auto_accept_pending_invitations(
      user_id,
      session.user.email,
      event.request.headers,
    )
  if (accepted) {
    session =
      (await auth.api.getSession({
        headers: event.request.headers,
      })) ?? session
  }
  event.locals.user = {
    id: user_id,
    email: session.user.email,
    name: session.user.name
      ? decrypt(session.user.name)
      : null,
    surname: session.user.surname
      ? decrypt(session.user.surname)
      : null,
    image: session.user.image ?? null,
  }
  const subscriptions =
    await fetch_user_subscriptions_cached(user_id)
  const raw_active_organization_id =
    session.session.activeOrganizationId ?? null
  const is_freelance_active =
    subscriptions.find(
      (s) =>
        s.organization_id === raw_active_organization_id,
    )?.type === SUBSCRIPTION_TYPE.FREELANCE
  event.locals.session = {
    id: session.session.id,
    userId: user_id,
    expiresAt: session.session.expiresAt,
    createdAt: session.session.createdAt,
    updatedAt: session.session.updatedAt,
    activeOrganizationId: is_freelance_active
      ? null
      : raw_active_organization_id,
  }
  event.locals.subscriptions = subscriptions
  return svelteKitHandler({
    event,
    resolve,
    auth,
    building,
  })
}
