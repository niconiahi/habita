import { redirect } from "@sveltejs/kit";
import { ACCESS_TYPE } from "$lib/access_type";
import { fetch_tenants } from "./fetchers/tenants.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google");
  }
  const property_ids = locals.user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR
    )
    .map((access) => access.property_id);
  const tenants = await fetch_tenants(property_ids);
  return { tenants };
};
