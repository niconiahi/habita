import { test as teardown } from "@playwright/test"
import { cleanup_test_data } from "./helpers/db"

teardown("cleanup test data", async () => {
  console.log("cleaning up test data")
  await cleanup_test_data()
  console.log("test data cleaned up")
})
