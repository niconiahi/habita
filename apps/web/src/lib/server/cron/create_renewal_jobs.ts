import { sql } from "kysely"
import { query_builder } from "../../../../db/query_builder"
import { now } from "../now"
import { logger } from "../../telemetry/logger"
import { publish_send_renewal_reminder } from "../broker/producer/publish_send_renewal_reminder"

async function fetch_expiring_organization_ids() {
  const seven_days_from_now = new Date()
  seven_days_from_now.setDate(
    seven_days_from_now.getDate() + 7,
  )
  return query_builder
    .selectFrom("subscription")
    .select("organization_id")
    .where(
      "ends_at",
      "<=",
      sql<Date>`${seven_days_from_now.toISOString()}::timestamptz`,
    )
    .where("ends_at", ">", sql<Date>`${now}::timestamptz`)
    .groupBy("organization_id")
    .execute()
}

async function fetch_grace_organization_ids() {
  return query_builder
    .selectFrom("subscription")
    .select("organization_id")
    .where("ends_at", "<=", sql<Date>`${now}::timestamptz`)
    .where(
      "ends_at",
      ">",
      sql<Date>`now() - interval '7 days'`,
    )
    .groupBy("organization_id")
    .execute()
}

export async function create_renewal_jobs() {
  const expiring_organizations =
    await fetch_expiring_organization_ids()
  logger.info(
    "found organizations with expiring subscriptions",
    {
      count: expiring_organizations.length,
    },
  )

  const grace_organizations =
    await fetch_grace_organization_ids()
  logger.info("found organizations in grace period", {
    count: grace_organizations.length,
  })

  const has_organizations_to_notify =
    expiring_organizations.length > 0 ||
    grace_organizations.length > 0

  if (!has_organizations_to_notify) {
    logger.info(
      "no organizations to notify, skipping event publish",
    )
    return { created: 0 }
  }

  await publish_send_renewal_reminder()

  logger.info("published send_renewal_reminder event")
  return { created: 1 }
}
