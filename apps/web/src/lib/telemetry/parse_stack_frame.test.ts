import { describe, expect, test } from "vitest"

import {
  normalize_path,
  parse_stack_frames,
} from "./parse_stack_frame"

describe("normalize_path", () => {
  test("strips file:// prefix", () => {
    expect(normalize_path("file:///app/src/foo.ts")).toBe(
      "src/foo.ts",
    )
  })

  test("strips /app/ container prefix", () => {
    expect(normalize_path("/app/src/routes/foo.ts")).toBe(
      "src/routes/foo.ts",
    )
  })

  test("strips leading ./", () => {
    expect(normalize_path("./src/foo.ts")).toBe("src/foo.ts")
  })

  test("converts backslashes to forward slashes", () => {
    expect(normalize_path("src\\routes\\foo.ts")).toBe(
      "src/routes/foo.ts",
    )
  })

  test("leaves build/server/chunks paths untouched", () => {
    expect(
      normalize_path("build/server/chunks/abc-123.js"),
    ).toBe("build/server/chunks/abc-123.js")
  })

  test("is idempotent on already-canonical paths", () => {
    expect(normalize_path("src/lib/foo.ts")).toBe(
      "src/lib/foo.ts",
    )
  })
})

describe("parse_stack_frames", () => {
  test("parses V8 frame with function name", () => {
    const frames = parse_stack_frames(
      "Error: boom\n    at create_user (/app/src/routes/users.ts:42:15)",
    )
    expect(frames).toEqual([
      {
        file: "src/routes/users.ts",
        line: 42,
        column: 15,
        function_name: "create_user",
      },
    ])
  })

  test("parses V8 frame without function name", () => {
    const frames = parse_stack_frames(
      "Error: boom\n    at /app/src/lib/foo.ts:1:1",
    )
    expect(frames).toEqual([
      {
        file: "src/lib/foo.ts",
        line: 1,
        column: 1,
        function_name: "<anonymous>",
      },
    ])
  })

  test("parses SpiderMonkey-format frame", () => {
    const frames = parse_stack_frames(
      "handler@http://localhost/_app/foo.js:10:20",
    )
    expect(frames).toEqual([
      {
        file: "http://localhost/_app/foo.js",
        line: 10,
        column: 20,
        function_name: "handler",
      },
    ])
  })

  test("skips error message header and unparseable lines", () => {
    const frames = parse_stack_frames(
      [
        "Error: something went wrong",
        "    at foo (/app/src/a.ts:1:1)",
        "    garbage line",
        "    at bar (/app/src/b.ts:2:2)",
      ].join("\n"),
    )
    expect(frames.map((frame) => frame.function_name)).toEqual([
      "foo",
      "bar",
    ])
  })

  test("normalizes file:// frames", () => {
    const frames = parse_stack_frames(
      "    at fn (file:///app/src/foo.ts:5:10)",
    )
    expect(frames[0].file).toBe("src/foo.ts")
  })
})
