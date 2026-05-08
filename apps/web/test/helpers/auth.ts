import fs from "node:fs/promises"
import path from "node:path"
import type { Page } from "@playwright/test"
import { auth } from "$lib/server/auth"

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

const TEST_TIMEOUT = 5000

const AUTHENTICATED_URL = /\/(properties|onboarding|admin)/

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
    page.waitForURL(AUTHENTICATED_URL, {
      timeout: TEST_TIMEOUT,
    }),
    visible_error.waitFor({
      state: "visible",
      timeout: TEST_TIMEOUT,
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

  await page.waitForURL(AUTHENTICATED_URL, {
    timeout: TEST_TIMEOUT,
  })
  console.log(`login complete for: ${user.email}`)
}

/**
 * Signs the user in via Better Auth's in-process API, captures the signed
 * Set-Cookie, and writes a Playwright storageState JSON. No browser, no UI.
 */
export async function create_test_auth_state(
  user: TestUser,
  auth_file: string,
): Promise<void> {
  const response = await auth.api.signInEmail({
    body: { email: user.email, password: user.password },
    asResponse: true,
  })
  if (!response.ok) {
    throw new Error(
      `sign-in failed for ${user.email}: ${response.status} ${await response.text()}`,
    )
  }

  const base_url = process.env.BETTER_AUTH_URL
  if (!base_url) throw new Error("BETTER_AUTH_URL is not set")
  const default_domain = new URL(base_url).hostname

  const cookies = response.headers
    .getSetCookie()
    .map(parse_set_cookie)
    .map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain ?? default_domain,
      path: cookie.path ?? "/",
      expires: cookie.expires ?? -1,
      httpOnly: cookie.http_only,
      secure: cookie.secure,
      sameSite: cookie.same_site,
    }))

  const auth_dir = path.join(
    process.cwd(),
    "test",
    "e2e",
    ".auth",
  )
  await fs.mkdir(auth_dir, { recursive: true })
  await fs.writeFile(
    path.join(auth_dir, auth_file),
    JSON.stringify({ cookies, origins: [] }, null, 2),
  )

  console.log(
    `wrote auth state for ${user.email} -> test/e2e/.auth/${auth_file}`,
  )
}

interface ParsedCookie {
  name: string
  value: string
  domain?: string
  path?: string
  expires?: number
  http_only: boolean
  secure: boolean
  same_site: "Strict" | "Lax" | "None"
}

function parse_set_cookie(header: string): ParsedCookie {
  const [pair, ...attrs] = header.split(/;\s*/)
  const equals_index = pair.indexOf("=")
  const name = pair.slice(0, equals_index)
  const value = pair.slice(equals_index + 1)
  const cookie: ParsedCookie = {
    name,
    value,
    http_only: false,
    secure: false,
    same_site: "Lax",
  }
  for (const attr of attrs) {
    const [key, ...rest] = attr.split("=")
    const lower = key.toLowerCase()
    const attr_value = rest.join("=")
    if (lower === "domain") cookie.domain = attr_value
    else if (lower === "path") cookie.path = attr_value
    else if (lower === "expires")
      cookie.expires = Math.floor(
        new Date(attr_value).getTime() / 1000,
      )
    else if (lower === "max-age")
      cookie.expires =
        Math.floor(Date.now() / 1000) + Number(attr_value)
    else if (lower === "httponly") cookie.http_only = true
    else if (lower === "secure") cookie.secure = true
    else if (lower === "samesite") {
      const normalized =
        attr_value.charAt(0).toUpperCase() +
        attr_value.slice(1).toLowerCase()
      if (
        normalized === "Strict" ||
        normalized === "Lax" ||
        normalized === "None"
      )
        cookie.same_site = normalized
    }
  }
  return cookie
}

/**
 * UI-driven authenticate: kept for tests that exercise the actual login flow.
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

  try {
    await page.waitForURL(AUTHENTICATED_URL, {
      timeout: TEST_TIMEOUT,
    })
    console.log(
      `user ${user.email} already exists, skipping signup`,
    )
  } catch {
    await signup_test_user(page, user)
  }

  // Save the authenticated state
  const auth_dir = path.join(
    process.cwd(),
    "test",
    "e2e",
    ".auth",
  )
  await fs.mkdir(auth_dir, { recursive: true })
  await page
    .context()
    .storageState({ path: path.join(auth_dir, auth_file) })

  console.log(`saved auth state to test/e2e/.auth/${auth_file}`)
}
