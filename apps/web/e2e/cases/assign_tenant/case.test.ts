import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  TEST_CANDIDATE,
  TEST_LANDLORD,
  TEST_MANAGER,
} from "../../helpers/auth"
import {
  assign_property_access,
  cleanup_test_property,
  create_reserved_slot,
  get_user_id_by_email,
} from "../../helpers/db"
import { fill_location } from "../../helpers/location"

let property_id: number

test.describe.serial("Assign Candidate as Tenant", () => {
  test.afterAll(async () => {
    if (property_id)
      await cleanup_test_property(property_id)
  })

  test.use({ storageState: "e2e/.auth/manager.json" })

  test("1. Creates a property with a reserved slot", async ({
    page,
  }) => {
    // Create property
    await page.goto("/admin/properties/new")
    await fill_location(page)
    await page.selectOption("#type", "0")
    await page.fill("#unit", "1A")
    await page.check('input[name="destiny"][value="0"]')
    await page.click('button[type="submit"]')

    await page.waitForURL(
      /\/admin\/properties\/\d+\/edit/,
    )
    const match = page
      .url()
      .match(/\/admin\/properties\/(\d+)\/edit/)
    expect(match).toBeTruthy()
    property_id = Number(match![1])

    // Assign landlord access
    const landlord_user_id = (await get_user_id_by_email(
      TEST_LANDLORD.email,
    ))!
    await assign_property_access(
      property_id,
      landlord_user_id,
      ACCESS_TYPE.LANDLORD,
    )

    // Create a reserved slot via DB (candidate booked it)
    const manager_user_id = (await get_user_id_by_email(
      TEST_MANAGER.email,
    ))!
    const candidate_user_id = (await get_user_id_by_email(
      TEST_CANDIDATE.email,
    ))!
    await create_reserved_slot(
      property_id,
      manager_user_id,
      candidate_user_id,
    )
  })

  test("2. Assigns candidate as tenant", async ({
    page,
  }) => {
    await page.goto("/admin/candidates")

    // Find the "Asignar como inquilino" button for this property
    const assign_button = page
      .locator(
        `form:has(input[name="property_id"][value="${property_id}"])`,
      )
      .getByRole("button", {
        name: "Asignar como inquilino",
      })
    await expect(assign_button).toBeVisible({
      timeout: 10000,
    })

    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      assign_button.click(),
    ])

    await expect(page).toHaveURL("/admin/candidates")
  })
})
