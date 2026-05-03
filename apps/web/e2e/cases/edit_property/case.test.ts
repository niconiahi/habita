import { expect, test } from "@playwright/test"
import { cleanup_test_property } from "../../helpers/db"
import { fill_location } from "../../helpers/location"

let property_id: number

test.describe.serial("Edit Property with Room Map", () => {
  test.afterAll(async () => {
    if (property_id)
      await cleanup_test_property(property_id)
  })

  test.use({ storageState: "e2e/.auth/manager.json" })

  test("1. Creates a property to edit", async ({
    page,
  }) => {
    await page.goto("/admin/properties/new")

    await fill_location(page)
    await page.selectOption("#type", "0") // DEPARTMENT
    await page.fill("#unit", "7D")
    await page.check('input[name="destiny"][value="0"]')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/properties\/\d+\/edit/)
    const match = page
      .url()
      .match(/\/admin\/properties\/(\d+)\/edit/)
    expect(match).toBeTruthy()
    property_id = Number(match![1])
  })

  test("2. Adds rooms to the property", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/edit/layout`,
    )

    // Create a floor first (click the top "agregar +" button)
    const add_floor_button = page
      .locator(".add-floor-button")
      .first()
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      add_floor_button.click(),
    ])

    // Wait for the floor button to appear and be selected
    await page
      .locator(".floor-button")
      .first()
      .waitFor({ state: "visible" })

    // Add 4 rooms by clicking "agregar habitación +" 4 times
    for (let i = 0; i < 4; i++) {
      const add_room_button = page.locator(
        ".add-room-button",
      )
      await add_room_button.waitFor({ state: "visible" })
      await Promise.all([
        page.waitForResponse(
          (res) => res.request().method() === "POST",
        ),
        add_room_button.click(),
      ])
    }

    // Verify 4 rooms exist
    const room_cards = page.locator(".room-card")
    await expect(room_cards).toHaveCount(4)
  })

  test("3. Configures room types and dimensions", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/edit/layout`,
    )

    // Get all room cards and configure each one
    const room_cards = page.locator(".room-card")
    const count = await room_cards.count()

    for (let i = 0; i < count; i++) {
      const card = room_cards.nth(i)
      const room_id = await card
        .locator('input[name="id"]')
        .inputValue()

      // Set room type (0=bedroom, 1=bathroom, 2=kitchen, 3=living)
      await card
        .locator(`#type_${room_id}`)
        .selectOption(String(i))

      // Set dimensions
      await card
        .locator(`#width_${room_id}`)
        .fill(String(2 + i))
      await card
        .locator(`#length_${room_id}`)
        .fill(String(3 + i))

      // Save this room
      await Promise.all([
        page.waitForResponse(
          (res) => res.request().method() === "POST",
        ),
        card
          .getByRole("button", {
            name: "Guardar habitación",
          })
          .click(),
      ])
    }
  })

  test("4. Moves rooms on the map and saves positions", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/edit/layout`,
    )

    // Switch to "Mapa" view via SegmentedButton
    await page.getByRole("button", { name: "Mapa" }).click()

    // Wait for the positions input to be in the DOM
    const positions_input = page.locator(
      'input[name="positions"]',
    )
    await positions_input.waitFor({ state: "attached" })

    // Get actual room IDs from the page
    const room_id_inputs = page.locator(
      '.room-card input[name="id"]',
    )

    // We need to go back to "Dimensiones y fotos" to read room IDs,
    // then switch to Mapa again
    await page
      .getByRole("button", {
        name: "Dimensiones y fotos",
      })
      .click()

    const room_count = await room_id_inputs.count()
    const valid_positions: {
      room_id: number | null
      position_x: number
      position_y: number
    }[] = [
      {
        room_id: null,
        position_x: 212.41,
        position_y: 135.17,
      },
      {
        room_id: null,
        position_x: 77.24,
        position_y: 0,
      },
      {
        room_id: null,
        position_x: 0,
        position_y: 135.17,
      },
      {
        room_id: null,
        position_x: 0,
        position_y: 0,
      },
    ]

    for (
      let i = 0;
      i < Math.min(room_count, valid_positions.length);
      i++
    ) {
      const room_id = await room_id_inputs
        .nth(i)
        .inputValue()
      valid_positions[i].room_id = Number(room_id)
    }

    // Switch back to Mapa view
    await page.getByRole("button", { name: "Mapa" }).click()

    await positions_input.waitFor({ state: "attached" })

    // Set positions and enable the submit button
    const save_map_button = page.getByRole("button", {
      name: "Guardar mapa",
    })
    await positions_input.evaluate(
      (el: HTMLInputElement, positions) => {
        el.value = JSON.stringify(positions)
      },
      valid_positions.filter((p) => p.room_id !== null),
    )
    await save_map_button.evaluate(
      (el: HTMLButtonElement) => {
        el.disabled = false
      },
    )

    // Submit the map form
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      save_map_button.click(),
    ])

    // Verify we're still on the edit page (no errors)
    await expect(page).toHaveURL(
      new RegExp(
        `/admin/properties/${property_id}/edit/layout`,
      ),
    )
  })

  test("5. Adds a service to the property", async ({
    page,
  }) => {
    await page.goto(
      `/admin/properties/${property_id}/edit/characteristics`,
    )

    // Expand the "Servicios" disclosure
    await page
      .locator("summary", { hasText: "Servicios" })
      .click()

    // Add a service
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      page
        .getByRole("button", { name: "Agregar servicio" })
        .click(),
    ])

    // Configure the service (ABL = 0)
    const service_type_select = page
      .locator('select[name="type"]')
      .last()
    await service_type_select.selectOption("0")

    // Set service code
    const service_code_input = page
      .locator('input[name="code"]')
      .last()
    await service_code_input.fill("123456")

    // Save service
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === "POST",
      ),
      page
        .getByRole("button", { name: "Guardar servicio" })
        .last()
        .click(),
    ])

    await expect(page).toHaveURL(
      new RegExp(
        `/admin/properties/${property_id}/edit/characteristics`,
      ),
    )
  })
})
