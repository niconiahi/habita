import fs from "node:fs/promises"
import path from "node:path"
import type { Page } from "@playwright/test"

export interface TestUser {
  email: string
  name: string
  surname: string
  password: string
  documentNumber: number
  phoneNumber: string
}

// Default password for all test users
const TEST_PASSWORD = "testpassword123"

export const TEST_MANAGER: TestUser = {
  email: "test-manager@habita.test",
  name: "Test",
  surname: "Manager",
  password: TEST_PASSWORD,
  documentNumber: 99999901,
  phoneNumber: "+5491100000001",
}

export const TEST_CANDIDATE: TestUser = {
  email: "test-candidate@habita.test",
  name: "Test",
  surname: "Candidate",
  password: TEST_PASSWORD,
  documentNumber: 99999902,
  phoneNumber: "+5491100000002",
}

export const TEST_LANDLORD: TestUser = {
  email: "test-landlord@habita.test",
  name: "Test",
  surname: "Landlord",
  password: TEST_PASSWORD,
  documentNumber: 99999903,
  phoneNumber: "+5491100000003",
}

/**
 * Signs up a test user via the /signup page.
 * If the user already exists, this will fail - use login instead.
 */
export async function signup_test_user(
  page: Page,
  user: TestUser,
): Promise<void> {
  console.log(`signing up user: ${user.email}`)
  await page.goto("/signup")

  // Fill the signup form using input IDs for reliability
  await page.locator("#name").fill(user.name)
  await page.locator("#surname").fill(user.surname)
  await page.locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)

  // Submit - wait for the button to be ready and click
  const submit_button = page.getByRole("button", {
    name: "Crear cuenta",
  })
  await submit_button.waitFor({ state: "visible" })
  await submit_button.click()

  // Wait for redirect to /onboarding (successful signup auto-logs in)
  // or wait for error message (filter out empty error placeholders)
  const visible_error = page
    .locator(".error")
    .filter({ hasText: /\S/ })
    .first()

  await Promise.race([
    page.waitForURL(/\/onboarding/, { timeout: 20000 }),
    visible_error.waitFor({
      state: "visible",
      timeout: 20000,
    }),
  ])

  // Check if we got an error
  if (await visible_error.isVisible()) {
    const error_text = await visible_error.textContent()
    throw new Error(`Signup failed: ${error_text}`)
  }

  console.log(`signup complete for: ${user.email}`)
}

/**
 * Logs in a test user via the /login page.
 */
export async function login_test_user(
  page: Page,
  user: TestUser,
): Promise<void> {
  console.log(`logging in user: ${user.email}`)
  await page.goto("/login")

  // Fill the login form using input IDs for reliability
  await page.locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)

  // Submit
  const submit_button = page.getByRole("button", {
    name: "Ingresar",
    exact: true,
  })
  await submit_button.waitFor({ state: "visible" })
  await submit_button.click()

  // Wait for redirect to /properties
  await page.waitForURL(/\/properties/, { timeout: 15000 })
  console.log(`login complete for: ${user.email}`)
}

/**
 * Ensures a test user exists (signs up if needed) and logs them in.
 * Saves the browser state to a file for reuse in tests.
 */
export async function authenticate_test_user(
  page: Page,
  user: TestUser,
  auth_file: string,
): Promise<void> {
  console.log(`authenticating user: ${user.email}`)

  // Try to login first (user might already exist from a previous run)
  await page.goto("/login")

  await page.locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)

  const submit_button = page.getByRole("button", {
    name: "Ingresar",
    exact: true,
  })
  await submit_button.waitFor({ state: "visible" })
  await submit_button.click()

  // Wait for either success (redirect to /properties) or stay on login (user doesn't exist yet)
  try {
    await page.waitForURL(/\/properties/, {
      timeout: 15000,
    })
    console.log(
      `user ${user.email} already exists, skipping signup`,
    )
  } catch {
    await signup_test_user(page, user)
  }

  // Save the authenticated state
  const auth_dir = path.join(process.cwd(), "e2e", ".auth")
  await fs.mkdir(auth_dir, { recursive: true })
  await page
    .context()
    .storageState({ path: path.join(auth_dir, auth_file) })

  console.log(`saved auth state to e2e/.auth/${auth_file}`)
}
