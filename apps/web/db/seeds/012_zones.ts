/**
 * ZONES - Precomputed zone data from Nominatim
 *
 * Seeds administrative boundaries extracted from the Nominatim
 * PostgreSQL database. Iterates over all country directories in
 * db/zones/ (e.g. argentina/data.tsv), each produced by a
 * country-specific extraction (e.g. just zone argentina).
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
} from "node:fs"
import { resolve } from "node:path"
import { type Kysely, sql } from "kysely"
import type { DB } from "../types"

const EXPECTED_HEADER =
  "name\tadmin_level\tlabel\tbadge\tgeometry_hex"
const ZONES_DIR = resolve(__dirname, "../zones")

function read_tsv(file_path: string): string[][] {
  const content = readFileSync(file_path, "utf-8")
  const lines = content.trim().split("\n").slice(1)
  return lines
    .map((line) => line.split("\t"))
    .filter((cols) => cols.every((c) => c !== ""))
}

function get_zone_files(): {
  country: string
  path: string
}[] {
  if (!existsSync(ZONES_DIR)) {
    return []
  }
  return readdirSync(ZONES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      country: entry.name,
      path: resolve(ZONES_DIR, entry.name, "data.tsv"),
    }))
    .filter(({ country, path }) => {
      if (!existsSync(path)) {
        console.log(
          `skipping ${country} — data.tsv not found (run just zone ${country} first)`,
        )
        return false
      }
      const content = readFileSync(path, "utf-8")
      const header = content.split("\n")[0].trim()
      if (header !== EXPECTED_HEADER) {
        console.log(
          `skipping ${country} — data.tsv has unexpected header (regenerate with just zone ${country})`,
        )
        return false
      }
      return true
    })
}

export async function seed(db: Kysely<DB>): Promise<void> {
  const zone_files = get_zone_files()
  if (zone_files.length === 0) {
    console.log(
      "skipping zones seed — no valid data in db/zones/",
    )
    return
  }

  for (const { country, path } of zone_files) {
    console.log(`seeding zones from ${country}`)
    const rows = read_tsv(path)
    for (const [
      name,
      admin_level,
      label,
      badge,
      geometry_hex,
    ] of rows) {
      await sql`
        INSERT INTO zone (name, admin_level, label, badge, geometry)
        VALUES (${name}, ${Number(admin_level)}, ${label}, ${badge}, ST_GeomFromEWKB(decode(${geometry_hex}, 'hex')))
        ON CONFLICT (name, admin_level, label) DO NOTHING
      `.execute(db)
    }
    console.log(`${country} complete (${rows.length} rows)`)
  }
}
