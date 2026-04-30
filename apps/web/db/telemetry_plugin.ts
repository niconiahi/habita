import {
  context,
  type Span,
  trace,
} from "@opentelemetry/api"
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely"

interface QueryMetadata {
  span: Span
  start_time: number
}

export class TelemetryPlugin implements KyselyPlugin {
  private tracer = trace.getTracer("web.database")
  private metadata_map = new Map<string, QueryMetadata>()

  transformQuery(
    args: PluginTransformQueryArgs,
  ): RootOperationNode {
    const { node, queryId } = args
    const operation = node.kind
    const table = get_table(node)
    const span = this.tracer.startSpan(
      `${operation} ${table}`,
      undefined,
      context.active(),
    )
    span.setAttribute("db.operation", operation)
    span.setAttribute("db.table", table)
    this.metadata_map.set(queryId.queryId, {
      span,
      start_time: Date.now(),
    })
    return node
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    const { result, queryId } = args
    const metadata = this.metadata_map.get(queryId.queryId)
    if (metadata) {
      const { span, start_time } = metadata
      const duration = Date.now() - start_time
      span.setAttribute("db.duration", duration)
      if (result.rows) {
        span.setAttribute(
          "db.rows_affected_count",
          result.rows.length,
        )
      }
      span.end()
      this.metadata_map.delete(queryId.queryId)
    }
    return result
  }
}

function get_table(node: RootOperationNode) {
  const n = node as any
  return (
    n.from?.froms?.[0]?.table?.identifier?.name ??
    n.into?.table?.identifier?.name ??
    n.table?.table?.identifier?.name ??
    "unknown"
  )
}
