import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.arrayBuffer()
  const response = await fetch(
    "http://otel-collector:4318/v1/logs",
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
