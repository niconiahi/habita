import { error } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"
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

  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) {
    error(500, "OTEL_EXPORTER_OTLP_ENDPOINT no está configurado")
  }

  const body = await request.arrayBuffer()
  const response = await fetch(
    `${endpoint}/${signal}`,
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
