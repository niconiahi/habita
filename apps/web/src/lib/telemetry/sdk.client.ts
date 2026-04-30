import { PUBLIC_OTEL_ENVIRONMENT } from "$env/static/public"
import { trace } from "@opentelemetry/api"
import { logs } from "@opentelemetry/api-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs"
import {
  BasicTracerProvider,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions"

let started = false

export function init_browser_telemetry() {
  if (started) return
  started = true
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "web-browser",
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
      PUBLIC_OTEL_ENVIRONMENT,
  })
  const trace_exporter = new OTLPTraceExporter({
    url: "/api/otel/v1/traces",
  })
  const tracer_provider = new BasicTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(trace_exporter),
    ],
  })
  trace.setGlobalTracerProvider(tracer_provider)
  const log_exporter = new OTLPLogExporter({
    url: "/api/otel/v1/logs",
  })
  const logger_provider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(log_exporter)],
  })
  logs.setGlobalLoggerProvider(logger_provider)
}
