import { error, json } from "@sveltejs/kit"
import { safe_async } from "$lib/safe_async"
import { safe_sync } from "$lib/safe_sync"
import { logger } from "$lib/telemetry/logger"
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

  // NOTE: new safe implementation
  const [fetch_error, response] = await safe_async(
    fetch(nominatim_url.toString(), {
      signal: controller.signal,
    }),
  )
  if (fetch_error) {
    clearTimeout(timeout)
    logger.error(fetch_error.message, { query }, fetch_error)
    if (fetch_error.name === "AbortError") {
      error(504, "Nominatim timeout")
    }
    return json(
      { error: "Nominatim fetch failed" },
      { status: 502 },
    )
  }
  clearTimeout(timeout)

  if (!response.ok) {
    error(502, "Nominatim service error")
  }

  const content_type = response.headers.get("content-type")
  if (!content_type?.includes("application/json")) {
    error(502, "Invalid response from Nominatim")
  }

  const text = await response.text()

  if (text.length > MAX_RESPONSE_SIZE) {
    error(502, "Response too large")
  }

  // NOTE: new safe implementation
  const [parse_error, data] = safe_sync(() =>
    JSON.parse(text),
  )
  if (parse_error) {
    logger.error(parse_error.message, { query }, parse_error)
    return json(
      { error: "Invalid JSON from Nominatim" },
      { status: 502 },
    )
  }

  return json(data)
}
