import { expect, test } from "@playwright/test"
import { cleanup_test_property } from "../../../helpers/db"
import { fill_location } from "../../../helpers/location"

let property_id: number
let contract_id: number

test.describe
  .serial("Empty Contract - Validation Errors", () => {
  test.use({ storageState: "e2e/.auth/manager.json" })

  test.afterAll(async () => {
    if (property_id) await cleanup_test_property(property_id)
  })

  test("1. Creates a property and empty contract", async ({
    page,
  }) => {
    // Create property
    await page.goto("/admin/properties/new")
    await fill_location(page)
    await page.selectOption("#type", "0")
    await page.fill("#unit", "9Z")
    await page.check('input[name="destiny"][value="0"]')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/properties\/\d+\/edit/)
    const property_match = page
      .url()
      .match(/\/admin\/properties\/(\d+)\/edit/)
    expect(property_match).toBeTruthy()
    property_id = Number(property_match![1])

    // Create contract with just the price
    await page.goto(
      `/admin/properties/${property_id}/contracts/new`,
    )
    await page.fill("#price", "100000")
    await page.click('button[type="submit"]')

    await page.waitForURL(
      /\/admin\/properties\/\d+\/contracts\/\d+\/edit/,
    )
    const contract_match = page
      .url()
      .match(/\/contracts\/(\d+)\/edit/)
    expect(contract_match).toBeTruthy()
    contract_id = Number(contract_match![1])
  })

  test("2. Generates PDF and sees all validation errors", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit`,
    )

    // Click "Generar contrato" without filling any sections
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      page.click('button:has-text("Generar contrato")'),
    ])

    // Verify all 7 validation error messages appear
    const errors = page.locator(".error")
    await expect(errors).toHaveCount(7)

    // Verify each specific error
    await expect(
      page.locator("text=Falta asignar un propietario"),
    ).toBeVisible()
    await expect(
      page.locator("text=Falta asignar un inquilino"),
    ).toBeVisible()
    await expect(
      page.locator("text=Falta la fecha de inicio"),
    ).toBeVisible()
    await expect(
      page.locator("text=Falta la fecha de finalización"),
    ).toBeVisible()
    await expect(
      page.locator("text=Falta el tipo de escalación"),
    ).toBeVisible()
    await expect(
      page.locator("text=Falta la duración de escalación"),
    ).toBeVisible()
    await expect(
      page.locator("text=Falta el porcentaje de mora"),
    ).toBeVisible()
  })
})
