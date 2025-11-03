import { process_jobs } from "./process_jobs"

async function main() {
  try {
    console.log("starting job processing")
    await process_jobs()
    console.log("job processing completed successfully")
    process.exit(0)
  } catch (error) {
    console.error(
      "fatal error during job processing:",
      error,
    )
    process.exit(1)
  }
}

main()
