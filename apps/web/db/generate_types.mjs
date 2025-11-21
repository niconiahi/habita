#!/usr/bin/env node

import { spawn } from "node:child_process"

const database_url = `postgres://${encodeURIComponent(process.env.POSTGRES_USER)}:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DB}`

const proc = spawn(
  "kysely-codegen",
  [
    "--out-file",
    "db/types.ts",
    "--dialect",
    "postgres",
    "--url",
    database_url,
  ],
  {
    stdio: "inherit",
  },
)

proc.on("exit", (code) => {
  process.exit(code || 0)
})
