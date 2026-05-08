import { test as setup } from "@playwright/test"
import {
  create_test_auth_state,
  TEST_CANDIDATE,
  TEST_LANDLORD,
  TEST_MANAGER,
} from "$test/helpers/auth"
import {
  create_credit_report,
  get_user_id_by_email,
} from "$test/helpers/db"

setup("create manager authentication", async () => {
  await create_test_auth_state(TEST_MANAGER, "manager.json")
})

setup("create candidate authentication", async () => {
  await create_test_auth_state(
    TEST_CANDIDATE,
    "candidate.json",
  )
  const user_id = await get_user_id_by_email(
    TEST_CANDIDATE.email,
  )
  if (user_id) await create_credit_report(user_id)
})

setup("create landlord authentication", async () => {
  await create_test_auth_state(TEST_LANDLORD, "landlord.json")
})
