import { readFileSync } from "node:fs"
import { join } from "node:path"

const UNKNOWN = "unknown"

export function resolve_vcs(env, git_dir) {
  if (env.COMMIT_SHA) {
    return {
      revision: env.COMMIT_SHA,
      branch: env.COMMIT_BRANCH ?? "main",
    }
  }
  return read_git_head(git_dir)
}

export function read_git_head(git_dir) {
  try {
    const head = readFileSync(join(git_dir, "HEAD"), "utf8").trim()
    if (head.startsWith("ref: ")) {
      const ref = head.slice("ref: ".length)
      const branch = ref.replace(/^refs\/heads\//, "")
      const revision = read_ref(git_dir, ref)
      return { revision, branch }
    }
    return { revision: head, branch: UNKNOWN }
  } catch {
    return { revision: UNKNOWN, branch: UNKNOWN }
  }
}

export function read_ref(git_dir, ref) {
  try {
    return readFileSync(join(git_dir, ref), "utf8").trim()
  } catch {
    try {
      const packed = readFileSync(
        join(git_dir, "packed-refs"),
        "utf8",
      )
      for (const line of packed.split("\n")) {
        if (line.endsWith(` ${ref}`)) return line.split(" ")[0]
      }
    } catch {}
    return UNKNOWN
  }
}
