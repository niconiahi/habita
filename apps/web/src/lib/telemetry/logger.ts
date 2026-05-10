import {
  context,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api"
import {
  type LogAttributes,
  logs,
  SeverityNumber,
} from "@opentelemetry/api-logs"

import { parse_stack_frames } from "./parse_stack_frame"
import {
  CODE_COLUMN_NUMBER,
  CODE_FILE_PATH,
  CODE_FUNCTION_NAME,
  CODE_LINE_NUMBER,
  CODE_STACKTRACE,
} from "./semconv"

function get_otel_logger() {
  return logs.getLoggerProvider().getLogger("web")
}

function warn(
  message: string,
  attributes?: LogAttributes,
): void {
  get_otel_logger().emit({
    severityNumber: SeverityNumber.WARN,
    body: message,
    attributes,
    context: context.active(),
  })
}

function info(
  message: string,
  attributes?: LogAttributes,
): void {
  get_otel_logger().emit({
    severityNumber: SeverityNumber.INFO,
    body: message,
    attributes,
    context: context.active(),
  })
}

function error(
  message: string,
  attributes?: LogAttributes,
  thrown_error?: Error,
) {
  const span = trace.getActiveSpan()
  if (span && thrown_error) {
    span.recordException(thrown_error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: thrown_error.message,
    })
  }

  get_otel_logger().emit({
    severityNumber: SeverityNumber.ERROR,
    body: message,
    attributes: {
      ...attributes,
      ...code_attributes(thrown_error),
    },
    context: context.active(),
  })
}

function code_attributes(
  thrown_error: Error | undefined,
): LogAttributes {
  if (!thrown_error?.stack) return {}
  const frames = parse_stack_frames(thrown_error.stack)
  const top = frames[0]
  if (!top) return { [CODE_STACKTRACE]: thrown_error.stack }
  return {
    [CODE_STACKTRACE]: thrown_error.stack,
    [CODE_FILE_PATH]: top.file,
    [CODE_LINE_NUMBER]: top.line,
    [CODE_COLUMN_NUMBER]: top.column,
    [CODE_FUNCTION_NAME]: top.function_name,
  }
}

function unknown(thrown: unknown) {
  const message =
    thrown instanceof Error
      ? thrown.message
      : String(thrown)
  const synthetic_error =
    thrown instanceof Error ? thrown : new Error(message)

  error("unknown error caught", {}, synthetic_error)
}

export const logger = {
  info,
  warn,
  error,
  unknown,
}
