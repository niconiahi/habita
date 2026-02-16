import { test as setup } from "@playwright/test"
import {
  TEST_MANAGER,
  TEST_CANDIDATE,
  TEST_LANDLORD,
  authenticate_test_user,
} from "./helpers/auth"
import {
  create_credit_report,
  get_user_id_by_email,
} from "./helpers/db"

setup("create manager authentication", async ({ page }) => {
  console.log("Setting up manager authentication...")
  await authenticate_test_user(
    page,
    TEST_MANAGER,
    "manager.json",
  )
})

setup(
  "create candidate authentication",
  async ({ page }) => {
    console.log("Setting up candidate authentication...")
    await authenticate_test_user(
      page,
      TEST_CANDIDATE,
      "candidate.json",
    )

    // Create credit report for candidate so they can book property visits
    const user_id = await get_user_id_by_email(
      TEST_CANDIDATE.email,
    )
    if (user_id) {
      await create_credit_report(user_id)
      console.log("Created credit report for candidate")
    }
  },
)

setup(
  "create landlord authentication",
  async ({ page }) => {
    console.log("Setting up landlord authentication...")
    await authenticate_test_user(
      page,
      TEST_LANDLORD,
      "landlord.json",
    )
  },
)
