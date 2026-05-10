import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import { NodeSDK } from "@opentelemetry/sdk-node"
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions"

import { resolve_vcs } from "./src/lib/telemetry/read_vcs.mjs"

if (!process.env.OTEL_SERVICE_NAME)
  throw new Error("OTEL_SERVICE_NAME is not set")
if (!process.env.OTEL_ENVIRONMENT)
  throw new Error("OTEL_ENVIRONMENT is not set")
if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
  throw new Error("OTEL_EXPORTER_OTLP_ENDPOINT is not set")

const REPOSITORY_URL = "https://github.com/habitarent/habita"
const REPOSITORY_NAME = "habita"

const is_prod = Boolean(process.env.COMMIT_SHA)
const vcs = resolve_vcs(process.env, "/app/.git")

const log_exporter = new OTLPLogExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
})

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: "1.0.0",
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
      process.env.OTEL_ENVIRONMENT,
    "vcs.ref.head.revision": vcs.revision,
    "vcs.ref.head.name": vcs.branch,
    "vcs.ref.head.type": "branch",
    "vcs.repository.url.full": REPOSITORY_URL,
    "vcs.repository.name": REPOSITORY_NAME,
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  }),
  logRecordProcessor: is_prod
    ? new BatchLogRecordProcessor(log_exporter)
    : new SimpleLogRecordProcessor(log_exporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": { enabled: true },
    }),
  ],
})

sdk.start()
