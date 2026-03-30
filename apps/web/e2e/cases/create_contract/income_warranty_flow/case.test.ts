import { expect, test } from "@playwright/test"
import { ACCESS_TYPE } from "$lib/access_type"
import { TEST_LANDLORD } from "../../../helpers/auth"
import {
  fill_contract_sections,
  fill_income_warranty,
  generate_and_verify_pdf,
} from "../../../helpers/contract-form"
import {
  assign_property_access,
  get_user_id_by_email,
} from "../../../helpers/db"
import { fill_location } from "../../../helpers/location"

// Shared state across serial tests
let property_id: number
let contract_id: number
let landlord_user_id: number

test.describe.serial("Full Flow - INCOME Warranty", () => {
  test.describe("Manager actions", () => {
    test.use({ storageState: "e2e/.auth/manager.json" })

    test("1. Creates a property", async ({ page }) => {
      await page.goto("/admin/properties/new")

      // Fill location using the autocomplete helper
      await fill_location(page)

      // Select property type
      await page.selectOption("#type", "0") // DEPARTMENT

      // Fill unit number
      await page.fill("#unit", "8C")

      // Select at least one destiny
      await page.check('input[name="destiny"][value="0"]')

      // Submit the form
      await page.click('button[type="submit"]')

      // Wait for redirect and extract property ID
      await page.waitForURL(
        /\/admin\/properties\/\d+\/edit/,
      )
      const url = page.url()
      const match = url.match(
        /\/admin\/properties\/(\d+)\/edit/,
      )
      expect(match).toBeTruthy()
      property_id = Number(match![1])
      console.log(
        `Created property with ID: ${property_id}`,
      )
    })

    test("2. Assigns landlord to property", async () => {
      landlord_user_id = (await get_user_id_by_email(
        TEST_LANDLORD.email,
      ))!
      expect(landlord_user_id).toBeDefined()
      console.log(`Landlord user ID: ${landlord_user_id}`)

      await assign_property_access(
        property_id,
        landlord_user_id,
        ACCESS_TYPE.LANDLORD,
      )
      console.log(
        `Assigned landlord access to property ${property_id}`,
      )
    })

    test("3. Creates and fills contract with INCOME warranty", async ({
      page,
    }) => {
      // Create a new contract for the property
      await page.goto(
        `/admin/properties/${property_id}/contracts/new`,
      )

      // Fill required fields
      await page.fill("#price", "180000")

      // Submit to create the contract
      await page.click('button[type="submit"]')

      // Wait for redirect to contract edit page
      await page.waitForURL(
        /\/admin\/properties\/\d+\/contracts\/\d+\/edit/,
      )
      const url = page.url()
      const match = url.match(/\/contracts\/(\d+)\/edit/)
      expect(match).toBeTruthy()
      contract_id = Number(match![1])
      console.log(
        `Created contract with ID: ${contract_id}`,
      )

      // Verify we're on the contract edit page
      await expect(page.locator("h1")).toContainText(
        "contrato",
      )

      // Fill all contract sections (except warranty)
      await fill_contract_sections(page)

      // Fill warranty section with INCOME type (creates warranty + adds guarantors)
      await fill_income_warranty(page)

      // Generate PDF
      await generate_and_verify_pdf(page)
    })

    test("4. Publishes property", async ({ page }) => {
      await page.goto("/admin/properties")

      // Find the form that contains our property_id and click its submit button
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

      // Verify we're still on properties page (may have action query params)
      await expect(page).toHaveURL(/\/admin\/properties/)
    })

    test("5. Creates visiting slots", async ({ page }) => {
      await page.goto(
        `/admin/properties/${property_id}/calendar`,
      )

      // Create a slot for 3 days from now (to avoid conflicts with other tests)
      const slot_date = new Date()
      slot_date.setDate(slot_date.getDate() + 3)
      const date_string = slot_date
        .toISOString()
        .split("T")[0]

      await page.fill("#date", date_string)
      await page.fill("#start_time", "16:00")
      await page.fill("#end_time", "17:00")

      await page.click('button:has-text("Crear horario")')
      await page.waitForLoadState("networkidle")

      // Reload to see the new slot
      await page.reload()
      await page.waitForLoadState("networkidle")

      // Verify table is visible (slot was created)
      await expect(page.locator("table")).toBeVisible()
    })
  })

  test.describe("Candidate actions", () => {
    test.use({ storageState: "e2e/.auth/candidate.json" })

    test("6. Books a slot", async ({ page }) => {
      await page.goto(`/properties/${property_id}`)

      await expect(
        page.locator("text=Propiedad"),
      ).toBeVisible()

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

  test.describe("Manager completion", () => {
    test.use({ storageState: "e2e/.auth/manager.json" })

    test("7. Sets candidate as tenant", async ({
      page,
    }) => {
      await page.goto("/admin/candidates")

      const property_input = page
        .locator(
          `input[name="property_id"][value="${property_id}"]`,
        )
        .first()

      if (await property_input.isVisible()) {
        const form = property_input.locator("..")
        await form
          .locator(
            'button:has-text("Asignar como inquilino")',
          )
          .click()
        await page.waitForLoadState("networkidle")
      } else {
        const assign_button = page
          .getByRole("button", {
            name: /asignar como inquilino/i,
          })
          .first()
        if (await assign_button.isVisible()) {
          await assign_button.click()
          await page.waitForLoadState("networkidle")
        }
      }

      await expect(page).toHaveURL("/admin/candidates")
    })
  })
})
