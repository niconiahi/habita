export async function generate_pdf_with_playwright(
  html: string,
): Promise<Buffer> {
  const response = await fetch("http://pdf:8082/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`PDF generation failed: ${error}`)
  }

  return Buffer.from(await response.arrayBuffer())
}
