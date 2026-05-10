export type StackFrame = {
  file: string
  line: number
  column: number
  function_name: string
}

const V8_FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/
const SPIDERMONKEY_FRAME = /^(.*?)@(.+?):(\d+):(\d+)$/
const ANONYMOUS = "<anonymous>"

export function parse_stack_frames(stack: string): StackFrame[] {
  const frames: StackFrame[] = []
  for (const line of stack.split("\n")) {
    const frame = parse_line(line)
    if (frame) frames.push(frame)
  }
  return frames
}

function parse_line(line: string): StackFrame | null {
  const v8 = V8_FRAME.exec(line)
  if (v8) {
    return {
      file: normalize_path(v8[2]),
      line: Number(v8[3]),
      column: Number(v8[4]),
      function_name: v8[1] ?? ANONYMOUS,
    }
  }
  const sm = SPIDERMONKEY_FRAME.exec(line)
  if (sm) {
    return {
      file: normalize_path(sm[2]),
      line: Number(sm[3]),
      column: Number(sm[4]),
      function_name: sm[1] || ANONYMOUS,
    }
  }
  return null
}

export function normalize_path(file_path: string): string {
  return file_path
    .replace(/\\/g, "/")
    .replace(/^file:\/\//, "")
    .replace(/^\/app\//, "")
    .replace(/^\.\//, "")
}
