import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest"

import {
  read_git_head,
  resolve_vcs,
} from "./read_vcs.mjs"

let git_dir: string

beforeEach(() => {
  git_dir = mkdtempSync(join(tmpdir(), "habita-git-"))
})

afterEach(() => {
  rmSync(git_dir, { recursive: true, force: true })
})

function write(path: string, content: string): void {
  const full_path = join(git_dir, path)
  mkdirSync(join(full_path, ".."), { recursive: true })
  writeFileSync(full_path, content)
}

describe("read_git_head", () => {
  test("loose ref: reads branch name and resolves SHA", () => {
    write("HEAD", "ref: refs/heads/feature/foo\n")
    write("refs/heads/feature/foo", "abc123def456\n")
    expect(read_git_head(git_dir)).toEqual({
      revision: "abc123def456",
      branch: "feature/foo",
    })
  })

  test("packed ref fallback: resolves SHA from packed-refs", () => {
    write("HEAD", "ref: refs/heads/main\n")
    write(
      "packed-refs",
      [
        "# pack-refs with: peeled fully-peeled sorted",
        "deadbeef000000000000000000000000000000000 refs/heads/main",
        "cafebabe000000000000000000000000000000000 refs/heads/other",
      ].join("\n"),
    )
    expect(read_git_head(git_dir)).toEqual({
      revision: "deadbeef000000000000000000000000000000000",
      branch: "main",
    })
  })

  test("detached HEAD: returns SHA directly with unknown branch", () => {
    write("HEAD", "abcdef1234567890\n")
    expect(read_git_head(git_dir)).toEqual({
      revision: "abcdef1234567890",
      branch: "unknown",
    })
  })

  test("missing .git dir: falls back to unknown/unknown", () => {
    expect(read_git_head("/nonexistent/path")).toEqual({
      revision: "unknown",
      branch: "unknown",
    })
  })

  test("loose ref present but ref file missing AND no packed-refs: SHA is unknown", () => {
    write("HEAD", "ref: refs/heads/main\n")
    expect(read_git_head(git_dir)).toEqual({
      revision: "unknown",
      branch: "main",
    })
  })
})

describe("resolve_vcs", () => {
  test("uses COMMIT_SHA env when set; defaults branch to main", () => {
    expect(resolve_vcs({ COMMIT_SHA: "deploy-sha" }, git_dir))
      .toEqual({ revision: "deploy-sha", branch: "main" })
  })

  test("uses COMMIT_BRANCH env when provided", () => {
    expect(
      resolve_vcs(
        { COMMIT_SHA: "deploy-sha", COMMIT_BRANCH: "release" },
        git_dir,
      ),
    ).toEqual({ revision: "deploy-sha", branch: "release" })
  })

  test("falls back to .git read when COMMIT_SHA is unset", () => {
    write("HEAD", "ref: refs/heads/dev\n")
    write("refs/heads/dev", "localsha\n")
    expect(resolve_vcs({}, git_dir)).toEqual({
      revision: "localsha",
      branch: "dev",
    })
  })

  test("empty COMMIT_SHA still triggers .git fallback", () => {
    write("HEAD", "ref: refs/heads/dev\n")
    write("refs/heads/dev", "localsha\n")
    expect(resolve_vcs({ COMMIT_SHA: "" }, git_dir)).toEqual({
      revision: "localsha",
      branch: "dev",
    })
  })
})
