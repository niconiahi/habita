import { redirect, error } from "@sveltejs/kit";
import * as v from "valibot";
import { ForceNumberSchema } from "$lib/force_number";
import {
  get_property_accesses,
  require_edit_access
} from "$lib/server/property_access";
import { fetch_candidates } from "./fetchers/candidates.server";
import { fetch_property } from "./fetchers/property.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    redirect(302, "/auth/google");
  }
  const property_id = v.parse(ForceNumberSchema, params.property_id, {
    message: "property id should be a number"
  });
  const property_accesses = get_property_accesses(locals.user, property_id);
  require_edit_access(property_accesses);
  const [candidates, property] = await Promise.all([
    fetch_candidates(property_id),
    fetch_property(property_id)
  ]);
  if (!property) {
    error(404, "property not found");
  }
  return { candidates, property };
};
