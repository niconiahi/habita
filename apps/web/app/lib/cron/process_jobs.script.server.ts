import { process_jobs } from "./process_jobs.server"
import { logger } from "~/lib/telemetry/logger.server"

async function main() {
  try {
    logger.info("starting job processing")
    await process_jobs()
    logger.info("job processing completed successfully")
    process.exit(0)
  } catch (error) {
    logger.error(
      "fatal error during job processing",
      {},
      error instanceof Error ? error : new Error(String(error)),
    )
    process.exit(1)
  }
}

main()
