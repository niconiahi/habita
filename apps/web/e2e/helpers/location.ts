import { expect, type Page } from "@playwright/test"

/**
 * Fills the location autocomplete input and selects the first result.
 * Uses pressSequentially to trigger proper input events for Svelte bindings.
 */
// Real addresses that return results from nominatim
export const ADDRESSES = {
  PROPERTY: "Hilario Ascasubi 89 Monte Grande",
  GUARANTOR: "boyaca 882",
}

export async function fill_location(
  page: Page,
  address: string = ADDRESSES.PROPERTY,
): Promise<void> {
  const location_input = page.locator("#location_input")

  // Scroll to and ensure input is visible
  await location_input.scrollIntoViewIfNeeded()
  await location_input.waitFor({ state: "visible" })

  // Click to focus and clear existing value
  await location_input.click()
  await location_input.fill("")

  // Wait for component to be ready
  await page.waitForTimeout(200)

  // Type character by character to trigger input events properly
  await location_input.pressSequentially(address, {
    delay: 50,
  })

  // Wait for autocomplete results with longer timeout
  const listbox = page.locator('[role="listbox"]')
  await expect(listbox).toBeVisible({ timeout: 20000 })

  // Select first option
  const first_option = listbox
    .locator('[role="option"]')
    .first()
  await expect(first_option).toBeVisible()
  await first_option.click()

  // Verify listbox closes after selection
  await expect(listbox).not.toBeVisible({ timeout: 5000 })
}
