import { expect, test } from "@playwright/test"
import { SEND_LANDLORD_INVITE_TOPIC } from "$lib/server/broker/events/send_landlord_invite"
import {
  assert_dead_letter_queue_is_empty,
  fetch_latest_message,
  get_message_header,
  parse_message_value,
} from "../../helpers/broker"
import { fill_location } from "../../helpers/location"

const LANDLORD_EMAIL = "landlord-invite-test@habita.test"

let property_id: number

test.describe
  .serial("Send Landlord Invite Email", () => {
    test.use({ storageState: "e2e/.auth/manager.json" })

    test("1. Creates a property", async ({ page }) => {
      await page.goto("/admin/properties/new")
      await fill_location(page)
      await page.selectOption("#type", "0")
      await page.fill("#unit", "5A")
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
    })

    test("2. Invites a landlord and verifies broker message", async ({
      page,
    }) => {
      await page.goto(
        `/admin/properties/${property_id}/edit`,
      )

      const email_input = page.locator("#email")
      await email_input.scrollIntoViewIfNeeded()
      await email_input.fill(LANDLORD_EMAIL)
      await page.click('button:has-text("Invitar dueño")')
      await page.waitForLoadState("networkidle")

      const message = await fetch_latest_message(
        SEND_LANDLORD_INVITE_TOPIC,
      )
      expect(message).toBeTruthy()

      const payload = parse_message_value(message!)
      expect(payload).toMatchObject({
        email: LANDLORD_EMAIL,
        subject: expect.any(String),
        html: expect.stringContaining("accept-invite"),
      })

      const message_id = get_message_header(
        message!,
        "message-id",
      )
      expect(message_id).toBeTruthy()

      await assert_dead_letter_queue_is_empty(
        SEND_LANDLORD_INVITE_TOPIC,
      )
    })
  })
