import { create_escalation_jobs } from "./create_escalation_jobs.server"
import { logger } from "~/lib/telemetry/log.server"

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
      error instanceof Error ? error : new Error(String(error)),
      "fatal error during escalation job creation",
    )
    process.exit(1)
  }
}

main()
