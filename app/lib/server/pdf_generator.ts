export async function generate_pdf_with_playwright(
  html: string,
): Promise<Buffer> {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle" })
  const pdf_buffer = await page.pdf({
    format: "A4",
    printBackground: true,
  })
  await browser.close()
  console.log("pdf_buffer", pdf_buffer)
  return Buffer.from(pdf_buffer)
}
