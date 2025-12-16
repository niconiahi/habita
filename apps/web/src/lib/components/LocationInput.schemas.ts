import * as v from "valibot";
import { ForceNumberSchema } from "$lib/force_number";

export const LocationSchema = v.object({
  place_id: v.number(),
  lat: v.union([v.pipe(v.string(), v.transform(Number)), v.number()]),
  lon: v.union([v.pipe(v.string(), v.transform(Number)), v.number()]),
  display_name: v.string(),
  address: v.object({
    road: v.string(),
    house_number: ForceNumberSchema,
    suburb: v.optional(v.string()),
    town: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string())
  })
});

export type Location = v.InferOutput<typeof LocationSchema>;
