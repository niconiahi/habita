import { test, expect } from "@playwright/test"
import { get_user_id_by_email } from "../../helpers/db"

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
    await page
      .locator("#email")
      .fill(REALTOR_USER.email)
    await page
      .locator("#password")
      .fill(REALTOR_USER.password)

    await page
      .getByRole("button", { name: "Crear cuenta" })
      .click()

    // Should redirect to onboarding after successful signup
    await page.waitForURL("/onboarding", {
      timeout: 15000,
    })

    // Choose realtor (Inmobiliaria)
    await page
      .getByRole("button", { name: "Inmobiliaria" })
      .click()

    // Should redirect to demo page
    await page.waitForURL("/demo", {
      timeout: 10000,
    })
    await expect(page).toHaveURL(/\/demo/)
  })

  test("2. Requests a demo from the demo page", async ({
    page,
  }) => {
    // Login first since this is a new browser context
    await page.goto("/login")
    await page.waitForLoadState("networkidle")

    await page
      .locator("#email")
      .fill(REALTOR_USER.email)
    await page
      .locator("#password")
      .fill(REALTOR_USER.password)

    await page
      .getByRole("button", { name: "Iniciar sesión" })
      .click()

    await page.waitForURL(/\/properties/, {
      timeout: 15000,
    })

    // Navigate to demo page
    await page.goto("/demo")
    await page.waitForLoadState("networkidle")

    // Request demo
    await page
      .getByRole("button", {
        name: "Que me contacten por email",
      })
      .click()
    await page.waitForLoadState("networkidle")

    // Verify success message
    await expect(
      page.locator("text=Te vamos a contactar"),
    ).toBeVisible()
  })

  test("3. Verifies user was created in database", async () => {
    const user_id = await get_user_id_by_email(
      REALTOR_USER.email,
    )
    expect(user_id).toBeDefined()
  })
})
