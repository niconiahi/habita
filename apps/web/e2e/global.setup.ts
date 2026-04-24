import { test as setup } from "@playwright/test"
import {
  authenticate_test_user,
  TEST_CANDIDATE,
  TEST_LANDLORD,
  TEST_MANAGER,
} from "./helpers/auth"
import {
  create_credit_report,
  get_user_id_by_email,
} from "./helpers/db"

setup("create manager authentication", async ({ page }) => {
  console.log("setting up manager authentication")
  await authenticate_test_user(
    page,
    TEST_MANAGER,
    "manager.json",
  )
})

setup(
  "create candidate authentication",
  async ({ page }) => {
    console.log("setting up candidate authentication")
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
      console.log("created credit report for candidate")
    }
  },
)

setup(
  "create landlord authentication",
  async ({ page }) => {
    console.log("setting up landlord authentication")
    await authenticate_test_user(
      page,
      TEST_LANDLORD,
      "landlord.json",
    )
  },
)
