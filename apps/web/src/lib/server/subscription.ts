import { redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import {
  SUBSCRIPTION_STATUS,
  type SubscriptionStatus,
} from "$lib/subscription_status"
import { kv } from "$lib/server/kv"

const GRACE_PERIOD_DAYS = 7
const SUBSCRIPTION_CACHE_TTL_SECONDS = 86400

export function resolve_subscription_status(
  ends_at: Date,
): SubscriptionStatus {
  const now = new Date()
  if (ends_at > now) {
    return SUBSCRIPTION_STATUS.ACTIVE
  }

  const grace_deadline = new Date(ends_at)
  grace_deadline.setDate(
    grace_deadline.getDate() + GRACE_PERIOD_DAYS,
  )
  if (now < grace_deadline) {
    return SUBSCRIPTION_STATUS.GRACE
  }

  return SUBSCRIPTION_STATUS.LOCKED
}

export function get_grace_days_remaining(
  ends_at: Date,
): number {
  const grace_deadline = new Date(ends_at)
  grace_deadline.setDate(
    grace_deadline.getDate() + GRACE_PERIOD_DAYS,
  )
  const diff =
    grace_deadline.getTime() - new Date().getTime()
  return Math.max(
    0,
    Math.ceil(diff / (1000 * 60 * 60 * 24)),
  )
}

export async function fetch_user_subscriptions(
  user_id: number,
) {
  const rows = await query_builder
    .selectFrom("subscription")
    .where("user_id", "=", user_id)
    .select([
      "id",
      "organization_id",
      "user_id",
      "status",
      "type",
      "starts_at",
      "ends_at",
    ])
    .execute()
  return rows.map((row) => ({
    ...row,
    starts_at: String(row.starts_at),
    ends_at: String(row.ends_at),
  }))
}

function compose_subscription_cache_key(user_id: number) {
  return `subscriptions:${user_id}`
}

export async function fetch_user_subscriptions_cached(
  user_id: number,
) {
  const cache_key = compose_subscription_cache_key(user_id)
  const cached = await kv.get(cache_key)
  if (cached) {
    return JSON.parse(cached) as Awaited<
      ReturnType<typeof fetch_user_subscriptions>
    >
  }
  const subscriptions =
    await fetch_user_subscriptions(user_id)
  await kv.set(
    cache_key,
    JSON.stringify(subscriptions),
    SUBSCRIPTION_CACHE_TTL_SECONDS,
  )
  return subscriptions
}

export async function invalidate_user_subscriptions_cache(
  user_id: number,
) {
  const cache_key = compose_subscription_cache_key(user_id)
  await kv.del(cache_key)
}

export async function fetch_subscription_payments(
  subscription_ids: number[],
) {
  if (subscription_ids.length === 0) {
    return []
  }
  const rows = await query_builder
    .selectFrom("subscription_payment")
    .innerJoin(
      "payment",
      "payment.id",
      "subscription_payment.payment_id",
    )
    .innerJoin(
      "payment_mercado_pago",
      "payment_mercado_pago.payment_id",
      "payment.id",
    )
    .where(
      "subscription_payment.subscription_id",
      "in",
      subscription_ids,
    )
    .select([
      "subscription_payment.subscription_id",
      "subscription_payment.processed_at",
      "payment.id as payment_id",
      "payment.created_at as payment_created_at",
      "payment_mercado_pago.operation_id",
      "payment_mercado_pago.status as mp_status",
    ])
    .orderBy("payment.created_at", "desc")
    .execute()
  return rows.map((row) => ({
    ...row,
    payment_created_at: String(row.payment_created_at),
    processed_at: row.processed_at
      ? String(row.processed_at)
      : null,
  }))
}

export async function fetch_organization_subscriptions(
  organization_id: string,
) {
  return query_builder
    .selectFrom("subscription")
    .where("organization_id", "=", organization_id)
    .selectAll()
    .execute()
}

type SubscriptionCheck =
  | { status: typeof SUBSCRIPTION_STATUS.ACTIVE }
  | {
      status: typeof SUBSCRIPTION_STATUS.GRACE
      days_remaining: number
    }

export function require_active_subscription(
  subscriptions: App.Locals["subscriptions"],
  active_organization_id: string | null,
): SubscriptionCheck {
  const subscription = subscriptions.find(
    (s) => s.organization_id === active_organization_id,
  )
  if (!subscription) {
    return { status: SUBSCRIPTION_STATUS.ACTIVE }
  }

  const status = resolve_subscription_status(
    new Date(subscription.ends_at),
  )

  if (status === SUBSCRIPTION_STATUS.LOCKED) {
    redirect(302, "/subscribe")
  }

  if (status === SUBSCRIPTION_STATUS.GRACE) {
    return {
      status: SUBSCRIPTION_STATUS.GRACE,
      days_remaining: get_grace_days_remaining(
        new Date(subscription.ends_at),
      ),
    }
  }

  return { status: SUBSCRIPTION_STATUS.ACTIVE }
}
