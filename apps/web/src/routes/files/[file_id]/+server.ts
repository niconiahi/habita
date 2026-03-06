import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { sql } from "kysely"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"
import { kv } from "$lib/server/kv"
import { require_view_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"
import type { RequestHandler } from "./$types"

const FileSchema = v.object({
  content: v.pipe(
    v.string(),
    v.transform((string) => Buffer.from(string, "base64")),
  ),
  mime: v.string(),
  basename: v.string(),
})

function compose_file_cache_key(id: number) {
  return `file:${id}`
}

async function get_file_property_id(
  file_id: number,
  user_id: number,
): Promise<number | null | undefined> {
  const result = await query_builder
    .selectFrom("property_file")
    .select(
      sql<number | null>`property_id`.as("property_id"),
    )
    .where("file_id", "=", file_id)
    .unionAll(
      query_builder
        .selectFrom("contract_file")
        .innerJoin(
          "contract",
          "contract.id",
          "contract_file.contract_id",
        )
        .select(
          sql<number | null>`contract.property_id`.as(
            "property_id",
          ),
        )
        .where("contract_file.file_id", "=", file_id),
    )
    .unionAll(
      query_builder
        .selectFrom("contract_item_file")
        .innerJoin(
          "contract_item",
          "contract_item.id",
          "contract_item_file.contract_item_id",
        )
        .innerJoin(
          "contract",
          "contract.id",
          "contract_item.contract_id",
        )
        .select(
          sql<number | null>`contract.property_id`.as(
            "property_id",
          ),
        )
        .where("contract_item_file.file_id", "=", file_id),
    )
    .unionAll(
      query_builder
        .selectFrom("receipt")
        .innerJoin(
          "contract",
          "contract.id",
          "receipt.contract_id",
        )
        .select(
          sql<number | null>`contract.property_id`.as(
            "property_id",
          ),
        )
        .where("receipt.file_id", "=", file_id),
    )
    .unionAll(
      query_builder
        .selectFrom("user_file")
        .select(sql<number | null>`null`.as("property_id"))
        .where("file_id", "=", file_id)
        .where("user_id", "=", user_id),
    )
    .limit(1)
    .executeTakeFirst()

  return result?.property_id
}

function is_image(url: URL): boolean {
  const secret = process.env.IMGPROXY_SOURCE_SECRET
  if (!secret) return false
  return url.searchParams.get("secret") === secret
}

export const GET: RequestHandler = async ({
  params,
  locals,
  request,
  url,
}) => {
  const file_id = v.parse(
    ForceNumberSchema,
    params.file_id,
    {
      message: "file id should be a number",
    },
  )
  if (!is_image(url)) {
    if (!locals.user) {
      error(401, "Unauthorized")
    }
    const property_id = await get_file_property_id(
      file_id,
      locals.user.id,
    )
    if (!property_id) {
      logger.warn("file access denied", {
        file_id,
        user_id: locals.user.id,
      })
      error(403, "Forbidden")
    } else {
      await require_view_access(
        request.headers,
        locals.user.id,
        property_id,
        locals.session?.activeOrganizationId,
      )
    }
  }
  const key = compose_file_cache_key(file_id)
  const fields_count = await kv.hlen(key)
  if (fields_count > 0) {
    const fields = await kv.hgetall(key)
    if (fields === null) {
      error(500, "cache fields can't be null")
    }
    const cached_file = v.parse(FileSchema, fields)
    return new Response(
      Uint8Array.from(cached_file.content),
      {
        headers: {
          "Content-Type": cached_file.mime,
          "Content-Disposition": `inline; filename="${cached_file.basename}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-cache, no-store",
        },
      },
    )
  }
  const file = await query_builder
    .selectFrom("file")
    .select(["content", "basename", "mime"])
    .where("id", "=", file_id)
    .executeTakeFirst()
  if (!file) {
    error(404, "file not found")
  }
  await kv.hmset(key, [
    "basename",
    file.basename,
    "content",
    file.content.toString("base64"),
    "mime",
    file.mime,
  ])
  return new Response(Uint8Array.from(file.content), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="${file.basename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache, no-store",
    },
  })
}
