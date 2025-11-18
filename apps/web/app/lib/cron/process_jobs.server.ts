import { query_builder } from "db/query_builder"
import { calculate_all_due_escalations } from "../calculate_all_due_escalations.server"
import { now } from "~/lib/now.server"
import { JOB_STATUS } from "~/lib/job_status.server"
import { JOB_TYPE } from "~/lib/job_type.server"

export async function process_jobs() {
  const pending_jobs = await query_builder
    .selectFrom("job")
    .selectAll()
    .where("status", "=", JOB_STATUS.PENDING)
    .orderBy("scheduled_at", "asc")
    .execute()
  console.log(
    `processing ${pending_jobs.length} pending jobs`,
  )
  for (const job of pending_jobs) {
    try {
      switch (job.type) {
        case JOB_TYPE.CALCULATE_PRICES: {
          const result =
            await calculate_all_due_escalations()
          console.log(
            `job ${job.id}: processed ${result.processed} contracts`,
          )
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
      console.log(`job ${job.id} completed successfully`)
    } catch (error) {
      if (error instanceof Error) {
        console.log("error.message", error.message)
        console.log("error.message", error.stack)
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
      console.log(`job ${job.id} marked as failed`)
    }
  }
}
