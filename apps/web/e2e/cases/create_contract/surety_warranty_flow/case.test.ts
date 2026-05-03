import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import { TEST_LANDLORD } from "../../../helpers/auth"
import {
  fill_contract_sections,
  fill_initial_price,
  fill_surety_warranty,
  generate_and_verify_pdf,
} from "../../../helpers/contract-form"
import {
  assign_property_access,
  cleanup_test_property,
  get_user_id_by_email,
} from "../../../helpers/db"
import { fill_location } from "../../../helpers/location"

let property_id: number
let contract_id: number

test.describe.serial("Full Flow - SURETY Warranty", () => {
  test.afterAll(async () => {
    if (property_id)
      await cleanup_test_property(property_id)
  })

  test.use({ storageState: "e2e/.auth/manager.json" })

  test("1. Creates a property", async ({ page }) => {
    await page.goto("/admin/properties/new")
    await fill_location(page)
    await page.selectOption("#type", "0")
    await page.fill("#unit", "6B")
    await page.check('input[name="destiny"][value="0"]')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/properties\/\d+\/edit/)
    const match = page
      .url()
      .match(/\/admin\/properties\/(\d+)\/edit/)
    expect(match).toBeTruthy()
    property_id = Number(match![1])
  })

  test("2. Assigns landlord to property", async () => {
    const landlord_user_id = (await get_user_id_by_email(
      TEST_LANDLORD.email,
    ))!
    expect(landlord_user_id).toBeDefined()
    await assign_property_access(
      property_id,
      landlord_user_id,
      ACCESS_TYPE.LANDLORD,
    )
  })

  test("3. Creates contract and fills sections", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/new`,
    )
    await page.fill("#price", "200000")
    await page.click('button[type="submit"]')

    await page.waitForURL(
      /\/admin\/properties\/\d+\/contracts\/\d+\/edit/,
    )
    const match = page
      .url()
      .match(/\/contracts\/(\d+)\/edit/)
    expect(match).toBeTruthy()
    contract_id = Number(match![1])

    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/sections`,
    )
    await fill_contract_sections(page)
  })

  test("4. Fills SURETY warranty", async ({ page }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/sections`,
    )
    await fill_surety_warranty(page)
  })

  test("5. Fills initial price and generates PDF", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/periods`,
    )
    await fill_initial_price(page)

    await page.goto(
      `/admin/properties/${property_id}/contracts/${contract_id}/edit/operations`,
    )
    await generate_and_verify_pdf(page)
  })
})
