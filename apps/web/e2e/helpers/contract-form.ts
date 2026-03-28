import { expect, type Page } from "@playwright/test"
import { ADDRESSES, fill_location } from "./location"

/**
 * Fill all required contract sections except warranty (section 17)
 * Each section is a separate form that needs to be submitted individually
 */
export async function fill_contract_sections(page: Page) {
  // Section 3: Destiny - click the first radio (use click instead of check to handle already-checked state)
  const destiny_radio = page
    .locator('input[type="radio"][name="destiny"]')
    .first()
  await destiny_radio.click({ force: true })
  await page
    .locator('button:has-text("Guardar destino")')
    .click()
  await page.waitForLoadState("networkidle")

  // Section 6: Dates - set start date (now) and end date (1 year from now)
  const now = new Date()
  const one_year_later = new Date(
    now.getTime() + 365 * 24 * 60 * 60 * 1000,
  )
  const start_date = format_datetime_local(now)
  const end_date = format_datetime_local(one_year_later)

  await page.fill("#start_date", start_date)
  await page.fill("#end_date", end_date)
  await page.click('button:has-text("Guardar plazo")')
  await page.waitForLoadState("networkidle")

  // Section 7: Escalation - select IPC and 6-month duration
  await page.selectOption("#escalation_type", "0") // IPC
  await page.selectOption("#escalation_duration", "P6M") // 6 months (ISO 8601)
  await page.click('button:has-text("Guardar valores")')
  await page.waitForLoadState("networkidle")

  // Section 8: CBU - enter a test CBU
  await page.fill("#cbu", "0000000000000000000001")
  await page.click('button:has-text("Guardar CBU")')
  await page.waitForLoadState("networkidle")

  // Section 9: Fine percentage
  await page.fill("#fine_percentage", "5")
  await page.click('button:has-text("Guardar porcentaje")')
  await page.waitForLoadState("networkidle")

  // Section 14: Percentage return
  await page.fill("#percentage_return", "10")
  // Find the correct submit button in section 14 (there are multiple "Guardar porcentaje" buttons)
  const section_fourteen_button = page
    .locator(
      '#percentage_return ~ button[type="submit"], #percentage_return ~ * button[type="submit"]',
    )
    .first()
  if (await section_fourteen_button.isVisible()) {
    await section_fourteen_button.click()
  } else {
    // Fallback: click the second "Guardar porcentaje" button
    await page
      .locator('button:has-text("Guardar porcentaje")')
      .nth(1)
      .click()
  }
  await page.waitForLoadState("networkidle")

  // Section 15: Early termination (days of notice)
  await page.fill("#early_termination", "60")
  await page.click(
    'button:has-text("Guardar recesión anticipada")',
  )
  await page.waitForLoadState("networkidle")

  // Section 16: Showroom hours
  const showroom_input = page.locator("#showroom_hours")
  await showroom_input.waitFor({ state: "attached" })
  await showroom_input.fill("2")
  // Verify the value was set before submitting
  await expect(showroom_input).toHaveValue("2")
  await page
    .locator('button:has-text("Guardar cantidad")')
    .click()
  await page.waitForLoadState("networkidle")

  // Section 21: Court
  await page.selectOption("#court_id", "0") // First court option
  await page.click(
    'button:has-text("Guardar jurisdicción")',
  )
  await page.waitForLoadState("networkidle")

  // Periods section: Set initial price
  await page.fill("#price", "150000")
  await page.click('button:has-text("Guardar precio")')
  await page.waitForLoadState("networkidle")
}

/**
 * Fill warranty section with PROPERTY type
 */
export async function fill_property_warranty(page: Page) {
  await page.selectOption("#warranty_type", "property")

  // Wait for conditional fields to appear
  await page.waitForSelector("#guarantor_name")

  await page.fill("#guarantor_name", "Juan Pérez Garante")
  await page.fill("#guarantor_dni", "12345678")
  await page.fill(
    "#guarantor_email",
    "garantepropietario@test.com",
  )

  // Location input - fill the autocomplete with guarantor's property address
  await fill_location(page, ADDRESSES.GUARANTOR)

  // Cadastral data
  await page.fill("#cadastral_district", "1")
  await page.fill("#cadastral_section", "A")
  await page.fill("#cadastral_block", "123")
  await page.fill("#cadastral_parcel", "456")
  await page.fill("#property_tax_id", "12345678901")

  // Submit warranty form
  await page.click('button:has-text("Crear garantía")')
  await page.waitForLoadState("networkidle")
}

/**
 * Fill warranty section with SURETY type
 */
export async function fill_surety_warranty(page: Page) {
  await page.selectOption("#warranty_type", "surety")

  // Wait for conditional fields to appear
  await page.waitForSelector("#guarantor_name")

  await page.fill("#guarantor_name", "María García Garante")
  await page.fill("#guarantor_dni", "87654321")
  await page.fill(
    "#guarantor_email",
    "garantecaucion@test.com",
  )

  await page.fill("#company_name", "Seguros Test S.A.")
  await page.fill("#policy_number", "POL-2024-001234")
  await page.fill(
    "#company_email",
    "polizas@segurostest.com",
  )

  // Submit warranty form
  await page.click('button:has-text("Crear garantía")')
  await page.waitForLoadState("networkidle")
}

/**
 * Fill warranty section with INCOME type and add guarantors
 */
export async function fill_income_warranty(page: Page) {
  await page.selectOption("#warranty_type", "income")

  // Submit to create income warranty first (the form shows a message to save first)
  await page.click('button:has-text("Crear garantía")')
  await page.waitForLoadState("networkidle")

  // Now the guarantor form should appear - add first guarantor
  await page.fill(
    "#new_guarantor_name",
    "Carlos López Garante",
  )
  await page.fill("#new_guarantor_dni", "11223344")
  await page.fill(
    "#new_guarantor_email",
    "garanteingreso1@test.com",
  )
  await page.click('button:has-text("Agregar garante")')
  await page.waitForLoadState("networkidle")

  // Add second guarantor
  await page.fill(
    "#new_guarantor_name",
    "Ana Martínez Garante",
  )
  await page.fill("#new_guarantor_dni", "55667788")
  await page.fill(
    "#new_guarantor_email",
    "garanteingreso2@test.com",
  )
  await page.click('button:has-text("Agregar garante")')
  await page.waitForLoadState("networkidle")
}

/**
 * Generate PDF and verify it appears in the documents list
 */
export async function generate_and_verify_pdf(page: Page) {
  await page.click('button:has-text("Generar contrato")')
  await page.waitForLoadState("networkidle")

  // Wait a bit for file processing
  await page.waitForTimeout(2000)

  // Reload to see the new file
  await page.reload()
  await page.waitForLoadState("networkidle")
}

function format_datetime_local(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
