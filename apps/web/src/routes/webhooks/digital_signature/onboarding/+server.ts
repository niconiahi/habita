import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import type { RequestHandler } from "./$types"

const ResultSchema = v.picklist(["ok", "error", "rejected"])

export const GET: RequestHandler = async ({ url }) => {
  const result = v.parse(
    ResultSchema,
    url.searchParams.get("result"),
  )
  if (result === "ok") {
    redirect(302, "/digital_signature/success")
  }
  if (result === "error") {
    redirect(302, "/digital_signature/error")
  }
  redirect(302, "/digital_signature/rejected")
}
