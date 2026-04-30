// @ts-nocheck
import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { require_authentication } from "$lib/server/auth"
import {
  escape_clickhouse,
  query_clickhouse,
} from "$lib/server/clickhouse"
import type { PageServerLoad } from "./$types"

const SpanRowSchema = v.object({
  Timestamp: v.string(),
  TraceId: v.string(),
  SpanId: v.string(),
  ParentSpanId: v.string(),
  SpanName: v.string(),
  SpanKind: v.string(),
  ServiceName: v.string(),
  Duration: v.union([v.string(), v.number()]),
  StatusCode: v.string(),
  StatusMessage: v.string(),
  SpanAttributes: v.record(v.string(), v.string()),
})

export const load = async ({
  locals,
  params,
}: Parameters<PageServerLoad>[0]) => {
  require_authentication(locals)

  const trace_id = escape_clickhouse(params.trace_id)

  const sql = `SELECT Timestamp, TraceId, SpanId, ParentSpanId, SpanName,
    SpanKind, ServiceName, Duration, StatusCode, StatusMessage,
    SpanAttributes
  FROM otel_traces
  WHERE TraceId = '${trace_id}'
  ORDER BY Timestamp ASC`

  const [query_error, spans] = await query_clickhouse(
    sql,
    SpanRowSchema,
  )

  if (query_error) {
    error(500, "Error al consultar el trace")
  }

  if (spans.length === 0) {
    error(404, "Trace no encontrado")
  }

  return {
    trace_id: params.trace_id,
    spans,
  }
}
