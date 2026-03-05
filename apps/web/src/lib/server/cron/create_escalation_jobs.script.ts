import { logger } from "$lib/telemetry/logger"
import { create_escalation_jobs } from "./create_escalation_jobs"

async function main() {
  try {
    logger.info("starting escalation job creation")
    const result = await create_escalation_jobs()
    logger.info("escalation job creation completed", {
      jobs_created: result.created,
    })
    process.exit(0)
  } catch (error) {
    logger.error(
      "fatal error during escalation job creation",
      {},
      error instanceof Error
        ? error
        : new Error(String(error)),
    )
    process.exit(1)
  }
}

main()
