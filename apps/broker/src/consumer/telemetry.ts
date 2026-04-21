import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { KafkaJsInstrumentation } from "@opentelemetry/instrumentation-kafkajs"
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis"
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { NodeSDK } from "@opentelemetry/sdk-node"
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions"

let started = false

export function init_telemetry() {
  if (started) return
  started = true

  if (!process.env.OTEL_SERVICE_NAME)
    throw new Error("OTEL_SERVICE_NAME is not set")
  if (!process.env.OTEL_ENVIRONMENT)
    throw new Error("OTEL_ENVIRONMENT is not set")

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: "1.0.0",
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
      process.env.OTEL_ENVIRONMENT,
  })

  const trace_exporter = new OTLPTraceExporter({
    url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  })

  const log_exporter = new OTLPLogExporter({
    url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
  })

  const log_processor = new BatchLogRecordProcessor(
    log_exporter,
  )

  const sdk = new NodeSDK({
    resource,
    traceExporter: trace_exporter,
    logRecordProcessor: log_processor,
    instrumentations: [
      new KafkaJsInstrumentation(),
      new IORedisInstrumentation(),
      new PgInstrumentation(),
    ],
  })

  sdk.start()
}
