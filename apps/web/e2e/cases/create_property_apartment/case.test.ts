import { expect, test } from "@playwright/test"
import { fill_location } from "../../helpers/location"

test.describe
  .serial("Create Property - Apartment", () => {
    test.use({ storageState: "e2e/.auth/manager.json" })

    test("1. Creates an apartment property", async ({
      page,
    }) => {
      await page.goto("/admin/properties/new")

      // Fill location using the autocomplete helper
      await fill_location(page)

      // Select property type: DEPARTMENT (0) — default
      await page.selectOption("#type", "0")

      // Verify unit field IS visible (required for DEPARTMENT)
      await expect(page.locator("#unit")).toBeVisible()

      // Fill unit number
      await page.fill("#unit", "5B")

      // Select at least one destiny
      await page.check('input[name="destiny"][value="0"]')

      // Submit the form
      await page.click('button[type="submit"]')

      // Wait for redirect to property edit page
      await page.waitForURL(
        /\/admin\/properties\/\d+\/edit/,
      )
      const url = page.url()
      const match = url.match(
        /\/admin\/properties\/(\d+)\/edit/,
      )
      expect(match).toBeTruthy()
      console.log(
        `Created apartment property with ID: ${match![1]}`,
      )
    })
  })
