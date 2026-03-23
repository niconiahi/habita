import { query_builder } from "../../../../db/query_builder"
import { JOB_STATUS } from "../../job_status"
import { JOB_TYPE } from "../../job_type"
import { now } from "../now"
import { logger } from "../../telemetry/logger"
import { calculate_all_due_escalations } from "../calculate_all_due_escalations"
import { send_renewal_reminder } from "./send_renewal_reminder"
import { extend_subscription } from "./extend_subscription"

export async function process_jobs() {
  const pending_jobs = await query_builder
    .selectFrom("job")
    .selectAll()
    .where("status", "=", JOB_STATUS.PENDING)
    .orderBy("scheduled_at", "asc")
    .execute()
  logger.info("processing pending jobs", {
    job_count: pending_jobs.length,
  })
  for (const job of pending_jobs) {
    try {
      switch (job.type) {
        case JOB_TYPE.CALCULATE_PRICES: {
          const result =
            await calculate_all_due_escalations()
          logger.info("job processed contracts", {
            job_id: job.id,
            contracts_processed: result.processed,
          })
          break
        }
        case JOB_TYPE.SEND_RENEWAL_REMINDER: {
          await send_renewal_reminder()
          logger.info("renewal reminders sent", {
            job_id: job.id,
          })
          break
        }
        case JOB_TYPE.EXTEND_SUBSCRIPTION: {
          await extend_subscription(job.id)
          logger.info("subscription extended", {
            job_id: job.id,
          })
          break
        }
        default: {
          throw new Error(`unknown job type: ${job.type}`)
        }
      }
      await query_builder
        .updateTable("job")
        .set({
          status: JOB_STATUS.FULFILLED,
          updated_at: now,
        })
        .where("id", "=", job.id)
        .execute()
      logger.info("job completed successfully", {
        job_id: job.id,
      })
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          "job failed",
          { job_id: job.id },
          error,
        )
      }
      await query_builder
        .transaction()
        .execute(async (trx) => {
          await trx
            .insertInto("failed_job")
            .values({
              job_id: job.id,
              attempt_count: 1,
              failed_at: now,
              created_at: now,
            })
            .execute()
          await trx
            .updateTable("job")
            .set({
              status: JOB_STATUS.FAILED,
              updated_at: now,
            })
            .where("id", "=", job.id)
            .execute()
        })
      logger.info("job marked as failed", {
        job_id: job.id,
      })
    }
  }
}
