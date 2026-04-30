import { error } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"
import { require_otel_endpoint } from "$lib/telemetry/env"
import type { RequestHandler } from "./$types"

const ALLOWED_SIGNALS = new Set(["v1/traces", "v1/logs"])

export const POST: RequestHandler = async ({
  params,
  request,
}) => {
  const signal = params.signal
  if (!ALLOWED_SIGNALS.has(signal)) {
    error(404, "señal no soportada")
  }

  const otel_endpoint = require_otel_endpoint(env)
  const body = await request.arrayBuffer()
  const response = await fetch(
    `${otel_endpoint}/${signal}`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("Content-Type") ??
          "application/json",
      },
      body,
    },
  )
  return new Response(response.body, {
    status: response.status,
  })
}
