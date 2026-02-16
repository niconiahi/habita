import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

const MAX_QUERY_LENGTH = 200
const REQUEST_TIMEOUT_MS = 5_000
const MAX_RESPONSE_SIZE = 1_000_000

export const GET: RequestHandler = async ({
  url,
  fetch,
}) => {
  const query = url.searchParams.get("q") || ""

  if (query.length > MAX_QUERY_LENGTH) {
    error(400, "Query too long")
  }

  const nominatim_url = new URL(
    "http://nominatim:8080/search",
  )
  nominatim_url.searchParams.set("q", query)
  nominatim_url.searchParams.set("format", "json")
  nominatim_url.searchParams.set("addressdetails", "1")
  nominatim_url.searchParams.set("limit", "10")

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  )

  try {
    const response = await fetch(nominatim_url.toString(), {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      error(502, "Nominatim service error")
    }

    const content_type =
      response.headers.get("content-type")
    if (!content_type?.includes("application/json")) {
      error(502, "Invalid response from Nominatim")
    }

    const text = await response.text()
    if (text.length > MAX_RESPONSE_SIZE) {
      error(502, "Response too large")
    }

    return json(JSON.parse(text))
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === "AbortError") {
      error(504, "Nominatim timeout")
    }
    throw err
  }
}
