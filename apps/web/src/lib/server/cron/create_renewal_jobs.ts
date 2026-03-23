import { sql } from "kysely"
import { query_builder } from "../../../../db/query_builder"
import { JOB_STATUS } from "../../job_status"
import { JOB_TYPE } from "../../job_type"
import { now } from "../now"
import { logger } from "../../telemetry/logger"

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
    .where(
      "ends_at",
      ">",
      sql<Date>`${now}::timestamptz`,
    )
    .groupBy("organization_id")
    .execute()
}

async function fetch_grace_organization_ids() {
  return query_builder
    .selectFrom("subscription")
    .select("organization_id")
    .where(
      "ends_at",
      "<=",
      sql<Date>`${now}::timestamptz`,
    )
    .where(
      "ends_at",
      ">",
      sql<Date>`now() - interval '7 days'`,
    )
    .groupBy("organization_id")
    .execute()
}

async function has_pending_reminder() {
  const job = await query_builder
    .selectFrom("job")
    .select("id")
    .where("type", "=", JOB_TYPE.SEND_RENEWAL_REMINDER)
    .where("status", "=", JOB_STATUS.PENDING)
    .executeTakeFirst()
  return !!job
}

async function has_recent_fulfilled_reminder() {
  const job = await query_builder
    .selectFrom("job")
    .select("id")
    .where("type", "=", JOB_TYPE.SEND_RENEWAL_REMINDER)
    .where("status", "=", JOB_STATUS.FULFILLED)
    .where(
      "updated_at",
      ">",
      sql<Date>`now() - interval '24 hours'`,
    )
    .executeTakeFirst()
  return !!job
}

export async function create_renewal_jobs() {
  let created = 0

  const expiring_organizations = await fetch_expiring_organization_ids()
  logger.info("found organizations with expiring subscriptions", {
    count: expiring_organizations.length,
  })

  for (const organization of expiring_organizations) {
    if (await has_pending_reminder()) {
      logger.info(
        "pending renewal reminder already exists, skipping",
        { organization_id: organization.organization_id },
      )
      continue
    }
    await query_builder
      .insertInto("job")
      .values({
        type: JOB_TYPE.SEND_RENEWAL_REMINDER,
        status: JOB_STATUS.PENDING,
        scheduled_at: now,
        created_at: now,
        updated_at: now,
      })
      .execute()
    created++
    logger.info("created pre-expiry renewal reminder job", {
      organization_id: organization.organization_id,
    })
  }

  const grace_organizations = await fetch_grace_organization_ids()
  logger.info("found organizations in grace period", {
    count: grace_organizations.length,
  })

  for (const organization of grace_organizations) {
    if (await has_pending_reminder()) {
      continue
    }
    if (await has_recent_fulfilled_reminder()) {
      continue
    }
    await query_builder
      .insertInto("job")
      .values({
        type: JOB_TYPE.SEND_RENEWAL_REMINDER,
        status: JOB_STATUS.PENDING,
        scheduled_at: now,
        created_at: now,
        updated_at: now,
      })
      .execute()
    created++
    logger.info(
      "created grace period renewal reminder job",
      { organization_id: organization.organization_id },
    )
  }

  return { created }
}
