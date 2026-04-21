import { sql } from "kysely"
import { query_builder } from "../../db/query_builder"
import { logger } from "../lib/logger"
import { kv } from "../lib/kv"
import { now } from "../lib/now"

async function invalidate_user_subscriptions_cache(
  user_id: number,
) {
  await kv.del(`subscriptions:${user_id}`)
}

export async function extend_subscription_by_payment_id(
  subscription_payment_id: number,
) {
  const subscription_payment = await query_builder
    .selectFrom("subscription_payment")
    .innerJoin(
      "subscription",
      "subscription.id",
      "subscription_payment.subscription_id",
    )
    .where(
      "subscription_payment.id",
      "=",
      subscription_payment_id,
    )
    .select([
      "subscription.organization_id",
      "subscription_payment.processed_at",
    ])
    .executeTakeFirstOrThrow()

  if (subscription_payment.processed_at) {
    logger.info(
      "subscription payment already processed, skipping",
      { subscription_payment_id },
    )
    return
  }

  const organization_id =
    subscription_payment.organization_id

  await query_builder.transaction().execute(async (tx) => {
    await tx
      .updateTable("subscription")
      .set({
        starts_at: sql`ends_at`,
        ends_at: sql`ends_at + interval '1 month'`,
        updated_at: now,
      })
      .where("organization_id", "=", organization_id)
      .execute()

    await tx
      .updateTable("subscription_payment")
      .set({ processed_at: now })
      .where("id", "=", subscription_payment_id)
      .execute()
  })

  const affected_users = await query_builder
    .selectFrom("subscription")
    .where("organization_id", "=", organization_id)
    .select("user_id")
    .execute()
  await Promise.all(
    affected_users.map((row) =>
      invalidate_user_subscriptions_cache(row.user_id),
    ),
  )

  logger.info("extended subscriptions for organization", {
    organization_id,
    subscription_payment_id,
  })
}
