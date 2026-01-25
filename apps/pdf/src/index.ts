import { chromium } from "playwright"

const PORT = process.env.PORT || 8082

async function generate_pdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle" })
  const pdf_buffer = await page.pdf({
    format: "A4",
    printBackground: true,
  })
  await browser.close()
  return Buffer.from(pdf_buffer)
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // Health check
    if (url.pathname === "/health" && req.method === "GET") {
      return new Response("OK", { status: 200 })
    }

    // PDF generation
    if (url.pathname === "/generate" && req.method === "POST") {
      try {
        const body = await req.json()
        const html = body.html

        if (!html || typeof html !== "string") {
          return new Response(JSON.stringify({ error: "Missing html field" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const pdf = await generate_pdf(html)

        return new Response(pdf, {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        })
      } catch (error) {
        console.error("PDF generation error:", error)
        return new Response(JSON.stringify({ error: "PDF generation failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`PDF service listening on port ${server.port}`)
