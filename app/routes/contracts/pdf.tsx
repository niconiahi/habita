import { chromium } from "playwright"
import { renderToString } from "react-dom/server"
import Contract from "./contract.mdx"

export type Props = {
  user: string
}
const props: Props = {
  user: "loco",
}

function Pdf() {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <Contract {...props} />
      </body>
    </html>
  )
}

export async function action() {
  const html = renderToString(<Pdf />)

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
