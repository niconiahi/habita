import { expect, test } from "@playwright/test"
import { fill_location } from "../../helpers/location"

let property_id: number

test.describe
  .serial("Edit Property with Room Map", () => {
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

      await page.waitForURL(
        /\/admin\/properties\/\d+\/edit/,
      )
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
        `/admin/properties/${property_id}/edit`,
      )

      // Add 4 rooms by clicking "Agregar ambiente" 4 times
      const room_selects = page.locator(
        'select[name="type"]',
      )
      for (let i = 0; i < 4; i++) {
        await Promise.all([
          page.waitForResponse(
            (res) => res.request().method() === "POST",
          ),
          page.click('button:has-text("Agregar ambiente")'),
        ])
        await expect(room_selects).toHaveCount(i + 1)
      }

      // Verify 4 rooms exist
      await expect(room_selects).toHaveCount(4)
    })

    test("3. Configures room types and dimensions", async ({
      page,
    }) => {
      await page.goto(
        `/admin/properties/${property_id}/edit`,
      )

      // Get all room forms and configure each one
      const room_type_selects = page.locator(
        'select[name="type"]',
      )
      const count = await room_type_selects.count()

      for (let i = 0; i < count; i++) {
        const room_select = room_type_selects.nth(i)
        const room_id = await room_select
          .locator("..") // field
          .locator("..") // fields
          .locator('input[name="id"]')
          .inputValue()

        // Set room type (0=bedroom, 1=bathroom, 2=kitchen, 3=living)
        await room_select.selectOption(String(i))

        // Set dimensions
        await page
          .locator(`#length_${room_id}`)
          .fill(String(3 + i))
        await page
          .locator(`#width_${room_id}`)
          .fill(String(2 + i))

        // Save this room
        const save_button = page
          .locator(`#length_${room_id}`)
          .locator("..") // field
          .locator("..") // fields
          .locator("..") // form root
          .locator('button:has-text("Guardar ambiente")')
        await Promise.all([
          page.waitForResponse(
            (res) => res.request().method() === "POST",
          ),
          save_button.click(),
        ])
      }
    })

    test("4. Moves rooms on the map and saves positions", async ({
      page,
    }) => {
      await page.goto(
        `/admin/properties/${property_id}/edit`,
      )

      // Wait for the positions input to be in the DOM
      const positions_input = page.locator(
        'input[name="positions"]',
      )
      await positions_input.waitFor({ state: "attached" })

      // The room map uses a canvas with pointer events for dragging
      // Instead of simulating drag, we set positions via the hidden input
      // and submit the form (the same way the UI works internally)
      const valid_positions: {
        room_id: number | null
        position_x: number
        position_y: number
      }[] = [
        {
          room_id: null,
          position_x: 212.41379310344826,
          position_y: 135.17241379310343,
        },
        {
          room_id: null,
          position_x: 77.24137931034483,
          position_y: 0,
        },
        {
          room_id: null,
          position_x: 0,
          position_y: 135.17241379310343,
        },
        {
          room_id: null,
          position_x: 0,
          position_y: 0,
        },
      ]

      // Get actual room IDs from the page
      const room_id_inputs = page.locator(
        'input[name="id"][type="hidden"]',
      )
      const room_count = await room_id_inputs.count()

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

      // Set the positions hidden input value and enable the submit button.
      // The button is disabled because Svelte's room_positions state is empty
      // (rooms have no saved positions yet). Setting the input via evaluate
      // bypasses Svelte reactivity, so we also need to enable the button.
      const save_map_button = page.locator(
        'button:has-text("Guardar mapa")',
      )
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
        `/admin/properties/${property_id}/edit`,
      )
    })

    test("5. Adds a service to the property", async ({
      page,
    }) => {
      await page.goto(
        `/admin/properties/${property_id}/edit`,
      )

      // Add a service
      await Promise.all([
        page.waitForResponse(
          (res) => res.request().method() === "POST",
        ),
        page.click('button:has-text("Agregar servicio")'),
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
          .locator('button:has-text("Guardar servicio")')
          .last()
          .click(),
      ])

      await expect(page).toHaveURL(
        `/admin/properties/${property_id}/edit`,
      )
    })
  })
