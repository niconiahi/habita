import { chromium } from "playwright"
import { renderToString } from "react-dom/server"

function HtmlShell({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  )
}

export async function action() {
  console.log("executing")
  const html = renderToString(
    <HtmlShell title="Invoice">
      <h1>ejemplo de PDF</h1>
    </HtmlShell>,
  )

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle" })
  const pdf_buffer = await page.pdf({
    format: "A4",
    printBackground: true,
  })
  await browser.close()

  return new Response(Uint8Array.from(pdf_buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="invoice.pdf"',
    },
  })
}
