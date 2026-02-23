import { test, expect } from "@playwright/test"
import { fill_location } from "../../helpers/location"

test.describe.serial("Create Property - House", () => {
  test.use({ storageState: ".auth/manager.json" })

  test("1. Creates a house property", async ({ page }) => {
    await page.goto("/admin/properties/new")

    // Fill location using the autocomplete helper
    await fill_location(page)

    // Select property type: HOUSE (1)
    await page.selectOption("#type", "1")

    // Verify unit field is NOT visible (only for DEPARTMENT)
    await expect(page.locator("#unit")).not.toBeVisible()

    // Select at least one destiny
    await page.check('input[name="destiny"][value="0"]')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for redirect to property edit page
    await page.waitForURL(/\/admin\/properties\/\d+\/edit/)
    const url = page.url()
    const match = url.match(
      /\/admin\/properties\/(\d+)\/edit/,
    )
    expect(match).toBeTruthy()
    console.log(
      `Created house property with ID: ${match![1]}`,
    )
  })
})
