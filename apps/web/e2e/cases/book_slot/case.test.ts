import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import { TEST_LANDLORD } from "../../helpers/auth"
import {
  assign_property_access,
  get_user_id_by_email,
} from "../../helpers/db"
import { fill_location } from "../../helpers/location"

let property_id: number

test.describe.serial("Book a Slot", () => {
  test.describe("Manager setup", () => {
    test.use({ storageState: "e2e/.auth/manager.json" })

    test("1. Creates and publishes a property with slots", async ({
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

      // Publish property
      await page.goto("/admin/properties")
      const publish_form = page
        .locator(
          `form:has(input[name="property_id"][value="${property_id}"])`,
        )
        .first()
      const submit_button = publish_form.locator(
        'button[type="submit"]',
      )
      if ((await submit_button.count()) > 0) {
        await submit_button.click()
        await page.waitForLoadState("networkidle")
      }

      // Create visiting slot for 4 days from now
      await page.goto(
        `/admin/properties/${property_id}/calendar`,
      )
      const slot_date = new Date()
      slot_date.setDate(slot_date.getDate() + 4)
      const date_string = slot_date
        .toISOString()
        .split("T")[0]

      await page.fill("#date", date_string)
      await page.fill("#start_time", "18:00")
      await page.fill("#end_time", "19:00")
      await page.click('button:has-text("Crear horario")')
      await page.waitForLoadState("networkidle")

      await page.reload()
      await page.waitForLoadState("networkidle")
      await expect(page.locator("table")).toBeVisible()
    })
  })

  test.describe("Candidate booking", () => {
    test.use({ storageState: "e2e/.auth/candidate.json" })

    test("2. Browses property and books a slot", async ({
      page,
    }) => {
      await page.goto(`/properties/${property_id}`)

      // Verify property page loads
      await expect(
        page.locator("text=Propiedad"),
      ).toBeVisible()

      // Click booking link
      const book_button = page.getByRole("link", {
        name: /reservar/i,
      })
      await expect(book_button).toBeVisible()

      const href = await book_button.getAttribute("href")
      expect(href).toContain(
        `/properties/${property_id}/book`,
      )

      await book_button.click()
      await page.waitForURL(
        `/properties/${property_id}/book`,
      )

      // Select first available date
      const date_radio = page
        .locator('input[type="radio"][name="date"]')
        .first()
      await expect(date_radio).toBeVisible({
        timeout: 5000,
      })
      await date_radio.check()

      await page.click(
        'button:has-text("Seleccionar fecha")',
      )
      await page.waitForLoadState("networkidle")

      // Select time slot
      const time_radio = page
        .locator('input[type="radio"][name="id"]')
        .first()
      await expect(time_radio).toBeVisible({
        timeout: 5000,
      })
      await time_radio.check()

      await page.click(
        'button:has-text("Reservar este horario")',
      )

      // Should redirect back to properties
      await page.waitForURL(/\/properties/)
    })
  })
})
