import type { RequestEvent } from "@sveltejs/kit"
import { kv } from "$lib/server/kv"

const WINDOW_SECONDS = 60
const DEFAULT_MAX_REQUESTS = 60

const ROUTE_LIMITS: {
  prefix: string
  max_requests: number
}[] = [
  { prefix: "/api/auth", max_requests: 10 },
  { prefix: "/webhooks", max_requests: 100 },
]

function get_max_requests(pathname: string) {
  const match = ROUTE_LIMITS.find((route) =>
    pathname.startsWith(route.prefix),
  )
  return match?.max_requests ?? DEFAULT_MAX_REQUESTS
}

export async function is_rate_limited(
  event: RequestEvent,
): Promise<boolean> {
  let ip: string
  try {
    ip = event.getClientAddress()
  } catch {
    return false
  }
  const pathname = event.url.pathname
  const max_requests = get_max_requests(pathname)
  const cache_key = `rate_limit:${pathname}:${ip}`
  const count = await kv.incr(cache_key)
  if (count === 1) {
    await kv.expire(cache_key, WINDOW_SECONDS)
  }
  return count > max_requests
}
