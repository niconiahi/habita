import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import { SEND_BOOKING_CONFIRMATION_TOPIC } from "$lib/server/broker/events/send_booking_confirmation"
import { query_builder } from "../../../db/query_builder"
import {
  TEST_CANDIDATE,
  TEST_LANDLORD,
  TEST_MANAGER,
} from "../../helpers/auth"
import {
  assert_dead_letter_queue_is_empty,
  fetch_latest_message,
  get_message_header,
  parse_message_value,
} from "../../helpers/broker"
import {
  assign_property_access,
  get_user_id_by_email,
} from "../../helpers/db"
import { fill_location } from "../../helpers/location"

const MANAGER_EMAIL = "nico@habita.rent"
const TENANT_EMAIL = "nicolas.accetta@gmail.com"

let property_id: number

async function update_user_email(
  user_id: number,
  email: string,
) {
  await query_builder
    .updateTable("user")
    .set({ email })
    .where("id", "=", user_id)
    .execute()
}

test.describe.serial("Send Booking Email", () => {
  test.describe("Manager setup", () => {
    test.use({ storageState: "e2e/.auth/manager.json" })

    test("1. Creates and publishes a property with slots", async ({
      page,
    }) => {
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
      const landlord_user_id = (await get_user_id_by_email(
        TEST_LANDLORD.email,
      ))!
      await assign_property_access(
        property_id,
        landlord_user_id,
        ACCESS_TYPE.LANDLORD,
      )
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

  test.describe("Swap emails and book", () => {
    test.use({ storageState: "e2e/.auth/candidate.json" })

    test("2. Swaps emails to real addresses and books a slot", async ({
      page,
    }) => {
      const manager_id = (await get_user_id_by_email(
        TEST_MANAGER.email,
      ))!
      const candidate_id = (await get_user_id_by_email(
        TEST_CANDIDATE.email,
      ))!
      // Move real users' emails to temp values to free the unique constraint
      const real_manager_id =
        await get_user_id_by_email(MANAGER_EMAIL)
      const real_tenant_id =
        await get_user_id_by_email(TENANT_EMAIL)
      if (real_manager_id) {
        await update_user_email(
          real_manager_id,
          `temp-${Date.now()}-manager@habita.test`,
        )
      }
      if (real_tenant_id) {
        await update_user_email(
          real_tenant_id,
          `temp-${Date.now()}-tenant@habita.test`,
        )
      }
      await update_user_email(manager_id, MANAGER_EMAIL)
      await update_user_email(candidate_id, TENANT_EMAIL)
      await page.goto(`/properties/${property_id}`)
      await expect(
        page.locator("text=Propiedad"),
      ).toBeVisible()
      const book_button = page.getByRole("link", {
        name: /reservar/i,
      })
      await expect(book_button).toBeVisible()
      await book_button.click()
      await page.waitForURL(
        `/properties/${property_id}/book`,
      )
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
      await page.waitForURL(/\/properties/)

      // Verify broker received the booking confirmation event
      const message = await fetch_latest_message(
        SEND_BOOKING_CONFIRMATION_TOPIC,
      )
      expect(message).toBeTruthy()

      const payload = parse_message_value(message!)
      expect(payload).toMatchObject({
        visitant: {
          email: expect.any(String),
          name: expect.any(String),
        },
        host: {
          email: expect.any(String),
          name: expect.any(String),
        },
        subject: expect.stringContaining("Visita"),
        visitant_text: expect.any(String),
        host_text: expect.any(String),
        content: expect.stringContaining("BEGIN:VCALENDAR"),
      })

      const message_id = get_message_header(
        message!,
        "message-id",
      )
      expect(message_id).toBeTruthy()

      await assert_dead_letter_queue_is_empty(
        SEND_BOOKING_CONFIRMATION_TOPIC,
      )

      // Restore all emails
      await update_user_email(
        manager_id,
        TEST_MANAGER.email,
      )
      await update_user_email(
        candidate_id,
        TEST_CANDIDATE.email,
      )
      if (real_manager_id) {
        await update_user_email(
          real_manager_id,
          MANAGER_EMAIL,
        )
      }
      if (real_tenant_id) {
        await update_user_email(
          real_tenant_id,
          TENANT_EMAIL,
        )
      }
    })
  })
})
