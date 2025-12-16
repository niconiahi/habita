import { redirect } from "@sveltejs/kit";
import { ACCESS_TYPE } from "$lib/access_type";
import { fetch_available_properties } from "./fetchers/available_properties.server";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google");
  }
  const admin_property_ids = locals.user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR
    )
    .map((access) => access.property_id);
  const available_properties =
    await fetch_available_properties(admin_property_ids);
  return { available_properties };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google");
    }
    const form_data = await request.formData();
    const property_id = form_data.get("property_id");
    if (!property_id) {
      return { error: "Debes seleccionar una propiedad" };
    }
    redirect(303, `/admin/properties/${property_id}/contracts/new`);
  }
};
