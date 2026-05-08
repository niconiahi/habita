import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import { SEND_BOOKING_CONFIRMATION_TOPIC } from "$lib/server/broker/events/send_booking_confirmation"
import {
  TEST_CANDIDATE,
  TEST_LANDLORD,
  TEST_MANAGER,
} from "$test/helpers/auth"
import {
  assert_dead_letter_queue_is_empty,
  fetch_latest_message,
  get_message_header,
  parse_message_value,
} from "$test/helpers/broker"
import {
  assign_property_access,
  cleanup_test_property,
  create_reserved_slot,
  get_user_id_by_email,
} from "$test/helpers/db"
import { fill_location } from "$test/helpers/location"

let property_id: number

test.describe.serial("Send Booking Email", () => {
  test.afterAll(async () => {
    if (property_id)
      await cleanup_test_property(property_id)
  })

  test.use({ storageState: "test/e2e/.auth/manager.json" })

  test("1. Creates a property with a reserved slot", async ({
    page,
  }) => {
    await page.goto("/admin/properties/new")
    await fill_location(page)
    await page.selectOption("#type", "0")
    await page.fill("#unit", "3F")
    await page.check('input[name="destiny"][value="0"]')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/properties\/\d+\/edit/)
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

    // Create a reserved slot via DB
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

  test("2. Confirms slot and verifies booking email event", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/edit/visits`,
    )

    // The reserved slot should show with a "Confirmar" button
    const confirm_button = page.getByRole("button", {
      name: "Confirmar",
    })
    await expect(confirm_button).toBeVisible({
      timeout: 10000,
    })

    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      confirm_button.click(),
    ])

    // Verify the slot state changed to "Confirmado"
    await expect(page.getByText("Confirmado")).toBeVisible({
      timeout: 5000,
    })

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
  })
})
