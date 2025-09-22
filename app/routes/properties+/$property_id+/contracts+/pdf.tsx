import * as dateFns from "date-fns"
import { chromium } from "playwright"
import { renderToString } from "react-dom/server"
import { DEFAULT_TYPE } from "~/lib/server/default_type"
import type { Duration } from "~/lib/server/duration"
import {
  FINE_TYPE,
  type FineType,
} from "~/lib/server/fine_type"
import Contract from "../../../../../mdx/contract.mdx"

export type Props = {
  end_date: string
  start_date: string
  duration: string
  owner: {
    name: string
    surname: string
    phone_number: number
    document_number: number
    location: {
      state: string
      road: string
      house_number: number
    }
  }
  fine: {
    type: FineType
    amount: number
    duration: Duration
  }
  default: {
    type: FineType
    amount: number
  }
  tenant: {
    name: string
    surname: string
    phone_number: number
    document_number: number
  }
  property: {
    unit: string
    floor: number
    location: {
      state: string
      road: string
      house_number: number
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
  fine: {
    duration: "P1D",
    amount: 10000,
    type: FINE_TYPE.FIXED,
  },
  default: {
    type: DEFAULT_TYPE.FIXED,
    amount: 100000,
  },
  owner: {
    name: "Mariano German",
    surname: "Fernandez",
    phone_number: 1122536622,
    document_number: 31675798,
    location: {
      state: "Buenos Aires",
      road: "Padilla",
      house_number: 1180,
    },
  },
  tenant: {
    name: "Raul Arnaldo",
    surname: "Espinoza",
    phone_number: 1122536622,
    document_number: 14742853,
  },
  property: {
    unit: "D",
    floor: 3,
    location: {
      state: "Buenos Aires",
      road: "Padilla",
      house_number: 1180,
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
