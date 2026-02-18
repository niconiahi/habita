import { createServer } from "node:http"
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

const server = createServer(async (req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200)
    res.end("OK")
    return
  }
  if (req.url === "/generate" && req.method === "POST") {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      const body = JSON.parse(Buffer.concat(chunks).toString())
      const html = body.html
      if (!html || typeof html !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Missing html field" }))
        return
      }
      const pdf = await generate_pdf(html)
      res.writeHead(200, { "Content-Type": "application/pdf" })
      res.end(pdf)
    } catch (err) {
      console.error("PDF generation error:", err)
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "PDF generation failed" }))
    }
    return
  }
  res.writeHead(404)
  res.end("Not Found")
})

server.listen(PORT, () => {
  console.log(`PDF service listening on port ${PORT}`)
})
