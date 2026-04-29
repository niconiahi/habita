// @ts-nocheck
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load = async () => {
  redirect(302, "/logs")
}
;null as any as PageServerLoad;