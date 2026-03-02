import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { PropertyTagTypeSchema } from "$lib/property_tag_type"
import { ServiceTypeSchema } from "$lib/service"
import { normalize_input } from "$lib/server/form"

const RANGE_PARAMS = [
  "ambientes",
  "dormitorios",
  "banos",
  "total_surface",
  "construction_year",
] as const

export const InputSchema = v.object({
  tags: v.optional(v.string()),
  services: v.optional(v.string()),
  ambientes_min: v.optional(ForceNumberSchema),
  ambientes_max: v.optional(ForceNumberSchema),
  dormitorios_min: v.optional(ForceNumberSchema),
  dormitorios_max: v.optional(ForceNumberSchema),
  banos_min: v.optional(ForceNumberSchema),
  banos_max: v.optional(ForceNumberSchema),
  total_surface_min: v.optional(ForceNumberSchema),
  total_surface_max: v.optional(ForceNumberSchema),
  construction_year_min: v.optional(ForceNumberSchema),
  construction_year_max: v.optional(ForceNumberSchema),
})

export type Filters = v.InferOutput<typeof InputSchema>

export function parse_filters(url: URL): Filters {
  const tags_param = url.searchParams.get("tags")
  const services_param = url.searchParams.get("services")
  const filters: Filters = {
    tags: tags_param ?? undefined,
    services: services_param ?? undefined,
  }
  for (const name of RANGE_PARAMS) {
    const min_val = url.searchParams.get(`${name}_min`)
    const max_val = url.searchParams.get(`${name}_max`)
    if (min_val !== null) {
      filters[`${name}_min`] = Number(min_val)
    }
    if (max_val !== null) {
      filters[`${name}_max`] = Number(max_val)
    }
  }
  return filters
}

function parse_ids<T>(param: string | undefined, schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>): T[] {
  if (!param) return []
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => v.safeParse(schema, Number(s)))
    .filter((r) => r.success)
    .map((r) => r.output)
}

export function parse_tag_types(tags_param: string | undefined) {
  return parse_ids(tags_param, PropertyTagTypeSchema)
}

export function parse_service_types(services_param: string | undefined) {
  return parse_ids(services_param, ServiceTypeSchema)
}

export async function execute(request: Request, form_data: FormData) {
  const input = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  const url = new URL(request.url)
  for (const key of url.searchParams.keys()) {
    if (key.startsWith("/")) {
      url.searchParams.delete(key)
    }
  }
  if (input.tags) {
    url.searchParams.set("tags", input.tags)
  } else {
    url.searchParams.delete("tags")
  }
  if (input.services) {
    url.searchParams.set("services", input.services)
  } else {
    url.searchParams.delete("services")
  }
  for (const name of RANGE_PARAMS) {
    const min_key = `${name}_min` as const
    const max_key = `${name}_max` as const
    if (input[min_key] !== undefined) {
      url.searchParams.set(min_key, String(input[min_key]))
    } else {
      url.searchParams.delete(min_key)
    }
    if (input[max_key] !== undefined) {
      url.searchParams.set(max_key, String(input[max_key]))
    } else {
      url.searchParams.delete(max_key)
    }
  }
  return { redirect_to: decodeURIComponent(url.pathname + url.search) }
}
