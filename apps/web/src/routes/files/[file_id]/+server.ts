import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_object,
  OBJECT_STORE_ERROR,
} from "$lib/server/object_store"
import {
  is_manager_of_visitant_file,
  require_view_access,
} from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"
import type { RequestHandler } from "./$types"

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
        .selectFrom("room_file")
        .innerJoin("room", "room.id", "room_file.room_id")
        .innerJoin("floor", "floor.id", "room.floor_id")
        .select(
          sql<number | null>`floor.property_id`.as(
            "property_id",
          ),
        )
        .where("room_file.file_id", "=", file_id),
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

export const GET: RequestHandler = async ({
  params,
  locals,
  request,
}) => {
  const file_id = v.parse(
    ForceNumberSchema,
    params.file_id,
    {
      message: "file id should be a number",
    },
  )
  if (!locals.user) {
    error(401, "Unauthorized")
  }
  const property_id = await get_file_property_id(
    file_id,
    locals.user.id,
  )
  if (property_id === undefined) {
    const has_manager_access =
      await is_manager_of_visitant_file(
        locals.user.id,
        file_id,
        locals.session?.activeOrganizationId,
      )
    if (!has_manager_access) {
      logger.warn("file access denied", {
        file_id,
        user_id: locals.user.id,
      })
      error(403, "Forbidden")
    }
  } else if (property_id !== null) {
    await require_view_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
  }

  const file = await query_builder
    .selectFrom("file")
    .select(["hash", "basename", "mime"])
    .where("id", "=", file_id)
    .executeTakeFirst()
  if (!file) {
    error(404, "file not found")
  }

  const [object_error, content] = await get_object(
    `files/${file.hash}`,
  )
  if (object_error) {
    if (
      object_error.type === OBJECT_STORE_ERROR.NOT_FOUND
    ) {
      error(404, "file content not found")
    }
    if (
      object_error.type === OBJECT_STORE_ERROR.GET_FAILED
    ) {
      error(500, "failed to retrieve file")
    }
    error(500, "failed to retrieve file")
  }

  return new Response(Uint8Array.from(content), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.basename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache, no-store",
    },
  })
}
