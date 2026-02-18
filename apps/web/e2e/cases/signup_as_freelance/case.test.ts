import { test, expect } from "@playwright/test"
import { get_user_id_by_email } from "../../helpers/db"

// Unique email to avoid conflicts with seeded test users
const FREELANCE_USER = {
  name: "Test",
  surname: "Freelance",
  email: `test-freelance-${Date.now()}@habita.test`,
  password: "testpassword123",
}

test.describe.serial("Signup as Freelance", () => {
  test("1. Signs up and chooses freelance account type", async ({
    page,
  }) => {
    // Sign up
    await page.goto("/signup")
    await page.waitForLoadState("networkidle")

    await page.locator("#name").fill(FREELANCE_USER.name)
    await page
      .locator("#surname")
      .fill(FREELANCE_USER.surname)
    await page
      .locator("#email")
      .fill(FREELANCE_USER.email)
    await page
      .locator("#password")
      .fill(FREELANCE_USER.password)

    await page
      .getByRole("button", { name: "Crear cuenta" })
      .click()

    // Should redirect to onboarding after successful signup
    await page.waitForURL("/onboarding", {
      timeout: 15000,
    })

    // Choose freelance
    await page.getByRole("button", { name: "Freelance" }).click()

    // Should redirect to admin properties
    await page.waitForURL("/admin/properties", {
      timeout: 10000,
    })
    await expect(page).toHaveURL(/\/admin\/properties/)
  })

  test("2. Verifies user was created in database", async () => {
    const user_id = await get_user_id_by_email(
      FREELANCE_USER.email,
    )
    expect(user_id).toBeDefined()
  })
})
