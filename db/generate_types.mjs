#!/usr/bin/env bun

import { spawn } from "bun"

const databaseUrl = `postgres://${encodeURIComponent(process.env.POSTGRES_USER)}:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DB}`

console.log(
  "• Using constructed DATABASE_URL from individual environment variables",
  databaseUrl,
)

const proc = spawn(
  [
    "kysely-codegen",
    "--out-file",
    "db/types.ts",
    "--dialect",
    "postgres",
    "--url",
    databaseUrl,
  ],
  {
    stdio: ["inherit", "inherit", "inherit"],
  },
)

const exitCode = await proc.exited
process.exit(exitCode)
