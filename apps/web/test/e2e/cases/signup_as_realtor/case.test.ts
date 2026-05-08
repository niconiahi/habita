import { expect, test } from "@playwright/test"
import {
  get_user_id_by_email,
  verify_test_email,
} from "$test/helpers/db"

// Unique email to avoid conflicts with seeded test users
const REALTOR_USER = {
  name: "Test",
  surname: "Realtor",
  email: `test-realtor-${Date.now()}@habita.test`,
  password: "testpassword123",
}

test.describe.serial("Signup as Realtor", () => {
  test("1. Signs up and chooses realtor account type", async ({
    page,
  }) => {
    // Sign up
    await page.goto("/signup")
    await page.waitForLoadState("networkidle")

    await page.locator("#name").fill(REALTOR_USER.name)
    await page
      .locator("#surname")
      .fill(REALTOR_USER.surname)
    await page.locator("#email").fill(REALTOR_USER.email)
    await page
      .locator("#password")
      .fill(REALTOR_USER.password)
    await page
      .locator("#password_confirmation")
      .fill(REALTOR_USER.password)

    await page
      .getByRole("button", { name: "Crear cuenta" })
      .click()

    // Should redirect to verification page after signup
    await page.waitForURL("/signup/verification", {
      timeout: 15000,
    })

    // Verify email programmatically and log in
    await verify_test_email(REALTOR_USER.email)
    await page.goto("/login?redirect_to=/onboarding")
    await page.locator("#email").fill(REALTOR_USER.email)
    await page
      .locator("#password")
      .fill(REALTOR_USER.password)
    await page
      .getByRole("button", {
        name: "Ingresar",
        exact: true,
      })
      .click()

    // Should redirect to onboarding after login
    await page.waitForURL("/onboarding", {
      timeout: 15000,
    })

    // Choose realtor (Inmobiliaria)
    await page
      .getByRole("button", { name: /Inmobiliaria/ })
      .click()
    await page
      .getByRole("button", {
        name: "Confirmar tipo de cuenta",
      })
      .click()

    // Should redirect to admin properties
    await page.waitForURL("/admin/properties", {
      timeout: 10000,
    })
    await expect(page).toHaveURL(/\/admin\/properties/)
  })

  test("2. Verifies user was created in database", async () => {
    const user_id = await get_user_id_by_email(
      REALTOR_USER.email,
    )
    expect(user_id).toBeDefined()
  })
})
