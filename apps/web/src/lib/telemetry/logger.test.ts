import { logs, SeverityNumber } from "@opentelemetry/api-logs"
import {
  InMemoryLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest"

import { logger } from "./logger"

const exporter = new InMemoryLogRecordExporter()
const provider = new LoggerProvider({
  processors: [new SimpleLogRecordProcessor(exporter)],
})

beforeAll(() => {
  logs.setGlobalLoggerProvider(provider)
})

afterAll(async () => {
  await provider.shutdown()
  logs.disable()
})

beforeEach(() => {
  exporter.reset()
})

describe("logger.error", () => {
  test("emits code.* attrs from the top stack frame and preserves user attrs", async () => {
    const error = new Error("boom")
    error.stack =
      "Error: boom\n    at fn (/app/src/foo.ts:1:2)\n    at caller (/app/src/bar.ts:3:4)"

    logger.error("something failed", { user_id: 42 }, error)

    const records = exporter.getFinishedLogRecords()
    expect(records).toHaveLength(1)
    const [record] = records
    expect(record.severityNumber).toBe(SeverityNumber.ERROR)
    expect(record.body).toBe("something failed")
    expect(record.attributes).toMatchObject({
      user_id: 42,
      "code.file.path": "src/foo.ts",
      "code.line.number": 1,
      "code.column.number": 2,
      "code.function.name": "fn",
      "code.stacktrace": error.stack,
    })
  })

  test("parsed code.* takes precedence over caller-supplied code.* attrs", () => {
    const error = new Error("boom")
    error.stack = "Error: boom\n    at fn (/app/src/foo.ts:1:2)"

    logger.error(
      "x",
      { "code.file.path": "user/override.ts" },
      error,
    )

    const [record] = exporter.getFinishedLogRecords()
    expect(record.attributes["code.file.path"]).toBe("src/foo.ts")
  })

  test("emits without code.* when no error is passed", () => {
    logger.error("plain error message", { foo: "bar" })

    const [record] = exporter.getFinishedLogRecords()
    expect(record.attributes).toEqual({ foo: "bar" })
  })

  test("emits stacktrace only when stack has no parseable frames", () => {
    const error = new Error("boom")
    error.stack = "Error: boom\n    not a frame"

    logger.error("x", {}, error)

    const [record] = exporter.getFinishedLogRecords()
    expect(record.attributes).toEqual({
      "code.stacktrace": error.stack,
    })
  })
})
