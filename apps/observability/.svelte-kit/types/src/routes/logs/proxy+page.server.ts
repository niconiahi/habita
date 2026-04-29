// @ts-nocheck
import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { require_authentication } from "$lib/server/auth"
import {
  escape_clickhouse,
  query_clickhouse,
} from "$lib/server/clickhouse"
import type { PageServerLoad } from "./$types"

const LogRowSchema = v.object({
  Timestamp: v.string(),
  SeverityText: v.string(),
  ServiceName: v.string(),
  Body: v.string(),
  TraceId: v.string(),
  SpanId: v.string(),
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
  const severity = url.searchParams.get("severity") ?? ""
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
  if (severity) {
    conditions.push(
      `SeverityText = '${escape_clickhouse(severity)}'`,
    )
  }

  const sql = `SELECT Timestamp, SeverityText, ServiceName, Body, TraceId, SpanId
    FROM otel_logs
    WHERE ${conditions.join(" AND ")}
    ORDER BY Timestamp DESC
    LIMIT ${limit}`

  const [services_error, services] =
    await query_clickhouse(
      `SELECT DISTINCT ServiceName FROM otel_logs WHERE Timestamp >= now() - INTERVAL 24 HOUR ORDER BY ServiceName`,
      ServiceRowSchema,
    )

  const [logs_error, logs] = await query_clickhouse(
    sql,
    LogRowSchema,
  )

  if (logs_error) {
    error(500, "Error al consultar los logs")
  }

  return {
    logs,
    services: services_error
      ? []
      : services.map((s) => s.ServiceName),
    filters: { service, severity, hours, limit },
  }
}
