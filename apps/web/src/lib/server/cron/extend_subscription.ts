import { sql } from "kysely"
import { query_builder } from "../../../../db/query_builder"
import { now } from "../now"
import { logger } from "../../telemetry/logger"

export async function extend_subscription(job_id: number) {
  const link = await query_builder
    .selectFrom("job_subscription_payment")
    .where("job_id", "=", job_id)
    .select("subscription_payment_id")
    .executeTakeFirstOrThrow()

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
      link.subscription_payment_id,
    )
    .select("subscription.organization_id")
    .executeTakeFirstOrThrow()

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
  })

  logger.info("extended subscriptions for organization", {
    organization_id,
    job_id,
  })
}
