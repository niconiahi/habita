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
  console.log(`Signing up user: ${user.email}`)
  await page.goto("/signup")

  // Wait for JS to be fully loaded (hydrated)
  await page.waitForLoadState("networkidle")

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

  // Wait for redirect to /properties (successful signup auto-logs in)
  // or wait for error message
  await Promise.race([
    page.waitForURL(/\/properties/, { timeout: 20000 }),
    page
      .locator(".error")
      .waitFor({ state: "visible", timeout: 20000 }),
  ])

  // Check if we got an error
  const error = await page.locator(".error").isVisible()
  if (error) {
    const error_text = await page
      .locator(".error")
      .textContent()
    throw new Error(`Signup failed: ${error_text}`)
  }

  console.log(`Signup complete for: ${user.email}`)
}

/**
 * Logs in a test user via the /login page.
 */
export async function login_test_user(
  page: Page,
  user: TestUser,
): Promise<void> {
  console.log(`Logging in user: ${user.email}`)
  await page.goto("/login")

  // Wait for JS to be fully loaded (hydrated)
  await page.waitForLoadState("networkidle")

  // Fill the login form using input IDs for reliability
  await page.locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)

  // Submit
  const submit_button = page.getByRole("button", {
    name: "Iniciar sesión",
  })
  await submit_button.waitFor({ state: "visible" })
  await submit_button.click()

  // Wait for redirect to /properties
  await page.waitForURL(/\/properties/, { timeout: 15000 })
  console.log(`Login complete for: ${user.email}`)
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
  console.log(`Authenticating user: ${user.email}`)

  // Try to login first (user might already exist from a previous run)
  await page.goto("/login")
  await page.waitForLoadState("networkidle")

  await page.locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)

  const submit_button = page.getByRole("button", {
    name: "Iniciar sesión",
  })
  await submit_button.waitFor({ state: "visible" })
  await submit_button.click()

  // Wait for either success (redirect to /properties) or stay on login (error)
  try {
    await page.waitForURL(/\/properties/, { timeout: 5000 })
    console.log(`Login successful for: ${user.email}`)
  } catch {
    // Login failed - user probably doesn't exist, try signup
    console.log(
      `Login failed for ${user.email}, attempting signup...`,
    )
    await signup_test_user(page, user)
  }

  // Save the authenticated state
  const auth_dir = path.join(process.cwd(), ".auth")
  await fs.mkdir(auth_dir, { recursive: true })
  await page
    .context()
    .storageState({ path: path.join(auth_dir, auth_file) })

  console.log(`Saved auth state to .auth/${auth_file}`)
}
