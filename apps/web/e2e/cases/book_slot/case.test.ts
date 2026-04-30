import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import { TEST_LANDLORD } from "../../helpers/auth"
import {
  assign_property_access,
  cleanup_test_property,
  get_user_id_by_email,
} from "../../helpers/db"
import { fill_location } from "../../helpers/location"

let property_id: number

test.describe.serial("Book a Slot", () => {
  test.afterAll(async () => {
    if (property_id)
      await cleanup_test_property(property_id)
  })

  test.use({ storageState: "e2e/.auth/manager.json" })

  test("1. Creates a property and assigns landlord", async ({
    page,
  }) => {
    // Create property
    await page.goto("/admin/properties/new")
    await fill_location(page)
    await page.selectOption("#type", "0")
    await page.fill("#unit", "3F")
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

    // Assign landlord
    const landlord_user_id = (await get_user_id_by_email(
      TEST_LANDLORD.email,
    ))!
    await assign_property_access(
      property_id,
      landlord_user_id,
      ACCESS_TYPE.LANDLORD,
    )
  })

  test("2. Creates a visiting slot via the visits tab", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/edit/visits`,
    )

    // Open the "Agregar horario" dialog
    await page
      .getByRole("button", { name: "Agregar horario" })
      .click()

    // Fill the slot form inside the dialog
    const slot_date = new Date()
    slot_date.setDate(slot_date.getDate() + 4)
    const date_string = slot_date
      .toISOString()
      .split("T")[0]

    await page.fill("#date", date_string)
    await page.fill("#start_time", "18:00")
    await page.fill("#end_time", "19:00")

    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      page
        .locator("dialog")
        .getByRole("button", { name: "Crear horario" })
        .click(),
    ])

    // Verify slot appears in the table after dialog closes
    await expect(page.locator("table")).toBeVisible({
      timeout: 10000,
    })
    // Verify a slot row exists with "Libre" state (free slot)
    await expect(page.getByText("Libre")).toBeVisible({
      timeout: 5000,
    })
  })

  test("3. Publishes the property", async ({ page }) => {
    await page.goto("/admin/properties")

    // Open the popover for this property
    await page
      .locator(
        `button[popovertarget="property-actions-${property_id}"]`,
      )
      .click()

    // Click "Publicar"
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      page
        .getByRole("button", { name: "Publicar" })
        .click(),
    ])

    // Verify state changed to "Publicada"
    await expect(
      page.getByText("Publicada"),
    ).toBeVisible()
  })
})
