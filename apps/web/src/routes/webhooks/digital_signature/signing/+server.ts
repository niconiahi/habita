import { redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { CONTRACT_STATE } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import {
  API_FETCH_ERROR,
  ApiFetchError,
  fetch_signed_document,
} from "$lib/server/digital_signature"
import { now } from "$lib/server/now"
import { upsert_file_from_buffer } from "$lib/server/upsert_file"
import { SIGNATURE_STATUS } from "$lib/signature_status"
import { logger } from "$lib/telemetry/logger"
import type { RequestHandler } from "./$types"

const PartySchema = v.picklist(["landlord", "tenant"])
const ResultSchema = v.picklist(["ok", "error", "rejected"])

const RESULT_TO_STATUS = {
  ok: SIGNATURE_STATUS.SIGNED,
  error: SIGNATURE_STATUS.ERROR,
  rejected: SIGNATURE_STATUS.REJECTED,
}

export const GET: RequestHandler = async ({ url }) => {
  const party = v.parse(
    PartySchema,
    url.searchParams.get("party"),
  )
  const result = v.parse(
    ResultSchema,
    url.searchParams.get("result"),
  )
  const contract_id = v.parse(
    ForceNumberSchema,
    url.searchParams.get("contract_id"),
  )
  const status = RESULT_TO_STATUS[result]
  if (party === "landlord") {
    await query_builder
      .updateTable("digital_signature")
      .set({
        landlord_status: status,
        updated_at: now,
      })
      .where("contract_id", "=", contract_id)
      .execute()
  } else {
    await query_builder
      .updateTable("digital_signature")
      .set({
        tenant_status: status,
        updated_at: now,
      })
      .where("contract_id", "=", contract_id)
      .execute()
  }
  logger.info("contract party signed", {
    contract_id,
    party,
    status,
  })
  if (result === "error") {
    redirect(302, "/digital_signature/error")
  }
  if (result === "rejected") {
    redirect(302, "/digital_signature/rejected")
  }
  const signature = await query_builder
    .selectFrom("digital_signature")
    .where("contract_id", "=", contract_id)
    .select([
      "document_id",
      "landlord_status",
      "tenant_status",
    ])
    .executeTakeFirst()
  if (
    signature &&
    signature.landlord_status === SIGNATURE_STATUS.SIGNED &&
    signature.tenant_status === SIGNATURE_STATUS.SIGNED &&
    signature.document_id
  ) {
    let signed_document: Awaited<
      ReturnType<typeof fetch_signed_document>
    >
    try {
      signed_document = await fetch_signed_document(
        signature.document_id,
      )
    } catch (error) {
      if (error instanceof ApiFetchError) {
        if (error.type === API_FETCH_ERROR.FETCH_FAILED) {
          logger.error(
            error.message,
            {
              contract_id,
              error_type: API_FETCH_ERROR.FETCH_FAILED,
            },
            error,
          )
        }
        if (error.type === API_FETCH_ERROR.API_ERROR) {
          logger.error(
            error.message,
            {
              contract_id,
              error_type: API_FETCH_ERROR.API_ERROR,
            },
            error,
          )
        }
        if (
          error.type === API_FETCH_ERROR.JSON_PARSE_FAILED
        ) {
          logger.error(
            error.message,
            {
              contract_id,
              error_type: API_FETCH_ERROR.JSON_PARSE_FAILED,
            },
            error,
          )
        }
        if (
          error.type ===
          API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
        ) {
          logger.error(
            error.message,
            {
              contract_id,
              error_type:
                API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED,
            },
            error,
          )
        }
      } else {
        logger.unknown(error)
      }
      redirect(302, "/digital_signature/error")
    }
    if (signed_document.Datos.ArchivoFirmadoBase64) {
      const signed_pdf = Buffer.from(
        signed_document.Datos.ArchivoFirmadoBase64,
        "base64",
      )
      await query_builder
        .transaction()
        .execute(async (tx) => {
          const file_id = await upsert_file_from_buffer(
            signed_pdf,
            "contract_signed.pdf",
            "application/pdf",
            tx,
          )
          await tx
            .insertInto("contract_file")
            .values({
              file_id,
              type: CONTRACT_FILE_TYPE.SIGNED,
              contract_id,
              created_at: now,
              updated_at: now,
            })
            .execute()
          await tx
            .updateTable("contract")
            .set({
              state: CONTRACT_STATE.ACTIVE,
              updated_at: now,
            })
            .where("id", "=", contract_id)
            .execute()
        })
      logger.info(
        "contract activated after both signatures",
        {
          contract_id,
        },
      )
    }
  }
  redirect(302, "/digital_signature/success")
}
