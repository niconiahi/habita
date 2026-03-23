import { redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import {
  SUBSCRIPTION_STATUS,
  type SubscriptionStatus,
} from "$lib/subscription_status"

const GRACE_PERIOD_DAYS = 7

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
