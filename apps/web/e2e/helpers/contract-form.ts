import { expect, type Page } from "@playwright/test"
import { ADDRESSES, fill_location } from "./location"

async function open_disclosure(page: Page, title: string) {
  const summary = page.locator("summary", {
    hasText: title,
  })
  const details = summary.locator("..")
  // getAttribute returns null when absent, "" when present
  if ((await details.getAttribute("open")) === null) {
    await summary.click()
  }
}

async function submit_and_wait(page: Page, button_text: string) {
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST",
    ),
    page.click(`button:has-text("${button_text}")`),
  ])
}

/**
 * Fill all required contract sections except warranty (section 17).
 * Expects to be on the contract /edit/sections page already.
 */
export async function fill_contract_sections(page: Page) {
  // Section 3: Destiny
  await open_disclosure(page, "Sección 3: destino")
  const destiny_radio = page
    .locator('input[type="radio"][name="destiny"]')
    .first()
  await destiny_radio.click({ force: true })
  await submit_and_wait(page, "Guardar destino")

  // Section 6: Dates
  await open_disclosure(page, "Sección 6: plazo")
  const now = new Date()
  const one_year_later = new Date(
    now.getTime() + 365 * 24 * 60 * 60 * 1000,
  )
  await page.fill("#start_date", format_datetime_local(now))
  await page.fill(
    "#end_date",
    format_datetime_local(one_year_later),
  )
  await submit_and_wait(page, "Guardar plazo")

  // Section 7: Escalation
  await open_disclosure(page, "Sección 7: canon locativo")
  await page.selectOption("#escalation_type", "0") // IPC
  await page.selectOption("#escalation_duration", "P6M")
  await submit_and_wait(page, "Guardar valores")

  // Section 8: CBU
  await open_disclosure(page, "Sección 8: forma de pago")
  await page.fill("#cbu", "0000000000000000000001")
  await submit_and_wait(page, "Guardar CBU")

  // Section 9: Fine percentage
  await open_disclosure(page, "Sección 9: mora")
  await page.fill("#fine_percentage", "5")
  await submit_and_wait(page, "Guardar porcentaje")

  // Section 14: Percentage return
  await open_disclosure(page, "Sección 14: devoluciones")
  await page.fill("#percentage_return", "10")
  // Use the button inside the devoluciones disclosure to avoid ambiguity
  const section_14 = page.locator(
    'details:has(summary:has-text("Sección 14"))',
  )
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST",
    ),
    section_14
      .getByRole("button", { name: "Guardar porcentaje" })
      .click(),
  ])

  // Section 15: Early termination
  await open_disclosure(
    page,
    "Sección 15: recesión anticipada",
  )
  await page.fill("#early_termination", "60")
  await submit_and_wait(page, "Guardar recesión anticipada")

  // Section 16: Showroom hours
  await open_disclosure(
    page,
    "Sección 16: muestra de propiedad",
  )
  const showroom_input = page.locator("#showroom_hours")
  await showroom_input.waitFor({ state: "attached" })
  await showroom_input.fill("2")
  await expect(showroom_input).toHaveValue("2")
  await submit_and_wait(page, "Guardar cantidad")

  // Section 21: Court
  await open_disclosure(page, "Sección 21: jurisdicción")
  await page.selectOption("#court_id", "0")
  await submit_and_wait(page, "Guardar jurisdicción")
}

/**
 * Fill initial price on the periods page.
 * Expects to be on the contract /edit/periods page already.
 */
export async function fill_initial_price(page: Page) {
  await page.fill("#price", "150000")
  await submit_and_wait(page, "Guardar precio")
}

/**
 * Fill warranty section with PROPERTY type.
 * Expects to be on the contract /edit/sections page already.
 */
export async function fill_property_warranty(page: Page) {
  await open_disclosure(page, "Sección 17: garantía")
  await page.selectOption("#warranty_type", "property")

  await page.waitForSelector("#guarantor_name")
  await page.fill("#guarantor_name", "Juan Pérez Garante")
  await page.fill("#guarantor_dni", "12345678")
  await page.fill(
    "#guarantor_email",
    "garantepropietario@test.com",
  )

  await fill_location(page, ADDRESSES.GUARANTOR)

  await page.fill("#cadastral_district", "1")
  await page.fill("#cadastral_section", "A")
  await page.fill("#cadastral_block", "123")
  await page.fill("#cadastral_parcel", "456")
  await page.fill("#property_tax_id", "12345678901")

  await submit_and_wait(page, "Crear garantía")
}

/**
 * Fill warranty section with SURETY type.
 * Expects to be on the contract /edit/sections page already.
 */
export async function fill_surety_warranty(page: Page) {
  await open_disclosure(page, "Sección 17: garantía")
  await page.selectOption("#warranty_type", "surety")

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

  await submit_and_wait(page, "Crear garantía")
}

/**
 * Fill warranty section with INCOME type and add guarantors.
 * Expects to be on the contract /edit/sections page already.
 */
export async function fill_income_warranty(page: Page) {
  await open_disclosure(page, "Sección 17: garantía")
  await page.selectOption("#warranty_type", "income")
  await submit_and_wait(page, "Crear garantía")

  // Reload to get clean state after warranty creation
  await page.reload()

  // Add first guarantor via dialog
  await open_disclosure(page, "Sección 17: garantía")
  await page
    .getByRole("button", { name: "Agregar garante" })
    .click()
  const dialog = page.locator("dialog[open]")
  await dialog.waitFor({ state: "visible" })
  await dialog.locator("#new_guarantor_name").fill("Carlos López Garante")
  await dialog.locator("#new_guarantor_dni").fill("11223344")
  await dialog
    .locator("#new_guarantor_email")
    .fill("garanteingreso1@test.com")
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST",
    ),
    dialog.getByRole("button", { name: "Agregar" }).click(),
  ])

  // Reload and add second guarantor
  await page.reload()
  await open_disclosure(page, "Sección 17: garantía")
  await page
    .getByRole("button", { name: "Agregar garante" })
    .click()
  const dialog2 = page.locator("dialog[open]")
  await dialog2.waitFor({ state: "visible" })
  await dialog2
    .locator("#new_guarantor_name")
    .fill("Ana Martínez Garante")
  await dialog2.locator("#new_guarantor_dni").fill("55667788")
  await dialog2
    .locator("#new_guarantor_email")
    .fill("garanteingreso2@test.com")
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST",
    ),
    dialog2.getByRole("button", { name: "Agregar" }).click(),
  ])
}

/**
 * Generate PDF via the operations page.
 * Expects to be on the contract /edit/operations page already.
 */
export async function generate_and_verify_pdf(page: Page) {
  await submit_and_wait(page, "Generar contrato")
  // Wait for file processing
  await page.waitForTimeout(2000)
}

function format_datetime_local(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
