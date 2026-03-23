import { logger } from "../../telemetry/logger"
import { create_renewal_jobs } from "./create_renewal_jobs"

async function main() {
  try {
    logger.info("starting renewal job creation")
    const result = await create_renewal_jobs()
    logger.info("renewal job creation completed", {
      jobs_created: result.created,
    })
    process.exit(0)
  } catch (error) {
    logger.error(
      "fatal error during renewal job creation",
      {},
      error instanceof Error
        ? error
        : new Error(String(error)),
    )
    process.exit(1)
  }
}

main()
