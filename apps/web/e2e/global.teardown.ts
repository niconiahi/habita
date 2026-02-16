import { test as teardown } from "@playwright/test"
import { cleanup_test_sessions } from "./helpers/db"

teardown("cleanup test sessions", async () => {
  console.log("Cleaning up test sessions...")
  await cleanup_test_sessions()
  console.log("Test sessions cleaned up")
})
