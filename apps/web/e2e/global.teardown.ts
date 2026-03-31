import { test as teardown } from "@playwright/test"
import { cleanup_test_data } from "./helpers/db"

teardown("cleanup test data", async () => {
  console.log("Cleaning up test data...")
  await cleanup_test_data()
  console.log("Test data cleaned up")
})
