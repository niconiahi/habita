import { create_escalation_jobs } from "./create_escalation_jobs.server"

async function main() {
  try {
    console.log("starting escalation job creation")
    const result = await create_escalation_jobs()
    console.log(
      `escalation job creation completed: ${result.created} jobs created`,
    )
    process.exit(0)
  } catch (error) {
    console.error(
      "fatal error during escalation job creation:",
      error,
    )
    process.exit(1)
  }
}

main()
