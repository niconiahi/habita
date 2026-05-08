import { expect, test } from "@playwright/test"
import { TEST_MANAGER } from "$test/helpers/auth"
import {
  cleanup_test_property,
  create_test_contract_state,
  get_user_id_by_email,
} from "$test/helpers/db"

let property_id: number
let contract_id: number

test.describe.serial("Route - contracts/[id]/edit/sections", () => {
  test.use({ storageState: "test/e2e/.auth/manager.json" })

  test.beforeAll(async () => {
    const user_id = await get_user_id_by_email(
      TEST_MANAGER.email,
    )
    if (!user_id)
      throw new Error("test manager user not found")
    const state = await create_test_contract_state(user_id)
    property_id = state.property_id
    contract_id = state.contract_id
  })

  test.afterAll(async () => {
    if (property_id) await cleanup_test_property(property_id)
  })

  test("renders all 11 section disclosures", async ({ page }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/sections`,
    )
    const titles = [
      "Sección 2: estado",
      "Sección 3: destino",
      "Sección 6: plazo",
      "Sección 7: canon locativo",
      "Sección 8: forma de pago",
      "Sección 9: mora",
      "Sección 14: devoluciones",
      "Sección 15: recesión anticipada",
      "Sección 16: muestra de propiedad",
      "Sección 17: garantía",
      "Sección 21: jurisdicción",
    ]
    for (const title of titles) {
      await expect(
        page.locator("summary", { hasText: title }).first(),
      ).toBeVisible()
    }
  })

  test("updates destiny and shows saving/saved ux", async ({ page }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/sections`,
    )
    const section = page.locator(
      'details:has(summary:has-text("Sección 3: destino"))',
    )
    await section.locator("summary").click()
    await section
      .locator('input[type="radio"][name="destiny"]')
      .first()
      .click({ force: true })

    const submit = section
      .locator('button[type="submit"]')
      .first()
    await submit.click({ force: true })
    await expect(submit).toContainText("Guardado")
  })

  test("plazo saves valid future range", async ({ page }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/sections`,
    )
    const section = page.locator(
      'details:has(summary:has-text("Sección 6: plazo"))',
    )
    await section.locator("summary").click()

    const start = format_for_input(
      new Date(Date.now() + ONE_DAY_MS),
    )
    const end = format_for_input(
      new Date(Date.now() + ONE_DAY_MS * 365),
    )
    await section.locator("#start_date").fill(start)
    await section.locator("#end_date").fill(end)

    const submit = section
      .locator('button[type="submit"]')
      .first()
    await submit.click({ force: true })
    await expect(submit).toContainText("Guardado")
  })
})

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function format_for_input(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
