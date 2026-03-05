import {
  BasicTracerProvider,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions"
import { logs } from "@opentelemetry/api-logs"
import { trace } from "@opentelemetry/api"

let started = false

export function init_browser_telemetry() {
  if (started) return
  started = true
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "web-browser",
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: "production",
  })
  const trace_exporter = new OTLPTraceExporter({
    url: "/api/logger",
  })
  const tracer_provider = new BasicTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(trace_exporter),
    ],
  })
  trace.setGlobalTracerProvider(tracer_provider)
  const log_exporter = new OTLPLogExporter({
    url: "/api/logger",
  })
  const logger_provider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(log_exporter)],
  })
  logs.setGlobalLoggerProvider(logger_provider)
}
