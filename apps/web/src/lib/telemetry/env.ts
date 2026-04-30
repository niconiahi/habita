import { error } from "@sveltejs/kit"

export function require_otel_endpoint(env: Record<string, string | undefined>): string {
  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) {
    error(500, "OTEL_EXPORTER_OTLP_ENDPOINT no está configurado")
  }
  return endpoint
}
