import { chromium } from "playwright"
import * as dateFns from "date-fns"
import { renderToString } from "react-dom/server"
import Contract from "../../../../../mdx/contract.mdx"

export type Props = {
  end_date: string
  start_date: string
  duration: string
  property: {
    unit: string
    floor: number
    owner: {
      name: string
      surname: string
      document_number: number
    }
    location: {
      state: string
      road: string
      house_number: number
    }
    tenant: {
      name: string
      surname: string
      document_number: number
    }
  }
}
const end_date = "2026-09-10T15:52:14.752Z"
const start_date = "2025-09-10T15:52:14.752Z"
const props: Props = {
  end_date,
  start_date,
  duration: `${dateFns.differenceInMonths(
    new Date(end_date),
    new Date(start_date),
  )} meses`,
  property: {
    unit: "D",
    floor: 3,
    location: {
      state: "Buenos Aires",
      road: "Padilla",
      house_number: 1180,
    },
    owner: {
      name: "Mariano German",
      surname: "Fernandez",
      document_number: 31675798,
    },
    tenant: {
      name: "Raul Arnaldo",
      surname: "Espinoza",
      document_number: 14742853,
    },
  },
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
