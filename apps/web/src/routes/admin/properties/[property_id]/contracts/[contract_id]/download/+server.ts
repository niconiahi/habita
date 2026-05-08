import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import {
  ObjectStoreError,
  OBJECT_STORE_ERROR,
  get_object,
} from "$lib/server/object_store"
import { require_view_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({
  params,
  locals,
  request,
}) => {
  if (!locals.user) {
    error(401, "Unauthorized")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const contract_id = v.parse(
    ForceNumberSchema,
    params.contract_id,
  )
  await require_view_access(
    request.headers,
    locals.user.id,
    property_id,
    locals.session?.activeOrganizationId,
  )
  const contract_file = await query_builder
    .selectFrom("contract_file")
    .innerJoin("file", "file.id", "contract_file.file_id")
    .where("contract_file.contract_id", "=", contract_id)
    .where(
      "contract_file.type",
      "=",
      CONTRACT_FILE_TYPE.CONTRACT,
    )
    .select(["file.hash", "file.basename", "file.mime"])
    .executeTakeFirst()
  if (!contract_file) {
    error(404, "Contrato aún no generado")
  }

  let content: Buffer
  try {
    content = await get_object(
      `files/${contract_file.hash}`,
    )
  } catch (object_error) {
    if (object_error instanceof ObjectStoreError) {
      if (
        object_error.type === OBJECT_STORE_ERROR.NOT_FOUND
      ) {
        error(404, "Contenido no encontrado")
      }
      error(500, "Error al recuperar el archivo")
    } else {
      logger.unknown(object_error)
    }
    error(500, "Error al recuperar el archivo")
  }

  return new Response(Uint8Array.from(content), {
    headers: {
      "Content-Type": contract_file.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(contract_file.basename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache, no-store",
    },
  })
}
