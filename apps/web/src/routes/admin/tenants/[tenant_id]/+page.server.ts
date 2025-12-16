import { redirect, error } from "@sveltejs/kit";
import * as v from "valibot";
import { ACCESS_TYPE } from "$lib/access_type";
import { ForceNumberSchema } from "$lib/force_number";
import { query_builder } from "$lib/server/db/query_builder";
import { fetch_tenant_by_id } from "./fetchers/tenant.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    redirect(302, "/auth/google");
  }
  const tenant_id = v.parse(ForceNumberSchema, params.tenant_id, {
    message: "tenant id should be a number"
  });
  const admin_property_ids = locals.user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR
    )
    .map((access) => access.property_id);
  const tenant_access = await query_builder
    .selectFrom("access")
    .where("access.user_id", "=", tenant_id)
    .where("access.type", "=", ACCESS_TYPE.TENANT)
    .where("access.property_id", "in", admin_property_ids)
    .select(["access.id"])
    .executeTakeFirst();
  if (!tenant_access) {
    error(403, "not authorized");
  }
  const tenant = await fetch_tenant_by_id(tenant_id);
  if (!tenant) {
    error(404, "tenant not found");
  }
  return { tenant };
};
