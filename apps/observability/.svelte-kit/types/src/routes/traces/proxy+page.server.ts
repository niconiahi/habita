// @ts-nocheck
import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { require_authentication } from "$lib/server/auth"
import {
  escape_clickhouse,
  query_clickhouse,
} from "$lib/server/clickhouse"
import type { PageServerLoad } from "./$types"

const TraceRowSchema = v.object({
  TraceId: v.string(),
  started_at: v.string(),
  root_duration: v.union([v.string(), v.number()]),
  span_count: v.union([v.string(), v.number()]),
  root_span_name: v.string(),
  root_service: v.string(),
  root_status: v.string(),
})

const ServiceRowSchema = v.object({
  ServiceName: v.string(),
})

export const load = async ({
  locals,
  url,
}: Parameters<PageServerLoad>[0]) => {
  require_authentication(locals, url)

  const service = url.searchParams.get("service") ?? ""
  const hours = Math.min(
    Math.max(Number(url.searchParams.get("hours") ?? "1"), 1),
    72,
  )
  const limit = Math.min(
    Math.max(
      Number(url.searchParams.get("limit") ?? "100"),
      1,
    ),
    500,
  )

  const conditions = [
    `Timestamp >= now() - INTERVAL ${hours} HOUR`,
  ]
  if (service) {
    conditions.push(
      `ServiceName = '${escape_clickhouse(service)}'`,
    )
  }

  const sql = `SELECT
    TraceId,
    min(Timestamp) AS started_at,
    max(Duration) AS root_duration,
    count() AS span_count,
    argMin(SpanName, Timestamp) AS root_span_name,
    argMin(ServiceName, Timestamp) AS root_service,
    argMin(StatusCode, Timestamp) AS root_status
  FROM otel_traces
  WHERE ${conditions.join(" AND ")}
  GROUP BY TraceId
  ORDER BY started_at DESC
  LIMIT ${limit}`

  const [services_error, services] =
    await query_clickhouse(
      `SELECT DISTINCT ServiceName FROM otel_traces WHERE Timestamp >= now() - INTERVAL 24 HOUR ORDER BY ServiceName`,
      ServiceRowSchema,
    )

  const [traces_error, traces] = await query_clickhouse(
    sql,
    TraceRowSchema,
  )

  if (traces_error) {
    error(500, "Error al consultar los traces")
  }

  return {
    traces,
    services: services_error
      ? []
      : services.map((s) => s.ServiceName),
    filters: { service, hours, limit },
  }
}
