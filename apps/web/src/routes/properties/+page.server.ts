import { redirect } from "@sveltejs/kit"
import { fetch_properties } from "$lib/server/fetchers/properties"
import { get_img_props } from "$lib/server/image"
import { display_location } from "$lib/display_location"
import {
  parse_filters,
  parse_tag_types,
  parse_service_types,
  set_filters,
} from "./actions/set_filters.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ url }) => {
  const filters = parse_filters(url)
  const tag_types = parse_tag_types(filters.tags)
  const service_types = parse_service_types(
    filters.services,
  )
  const properties = await fetch_properties({
    tag_types,
    service_types,
    ambientes_min: filters.ambientes_min,
    ambientes_max: filters.ambientes_max,
    dormitorios_min: filters.dormitorios_min,
    dormitorios_max: filters.dormitorios_max,
    banos_min: filters.banos_min,
    banos_max: filters.banos_max,
    total_surface_min: filters.total_surface_min,
    total_surface_max: filters.total_surface_max,
    construction_year_min: filters.construction_year_min,
    construction_year_max: filters.construction_year_max,
  })
  const properties_with_image_props = properties.map(
    (property) => ({
      ...property,
      images: property.images.map((image, index) => ({
        ...image,
        props: get_img_props(image.id, image.hash, {
          widths: [400, 800],
          sizes: [
            "(max-width: 600px) 400px, (max-width: 900px) 800px",
          ],
        }),
        alt: `property at ${display_location(property.location)} - image ${index + 1}`,
      })),
    }),
  )
  return {
    properties: properties_with_image_props,
    filters,
  }
}

export const actions: Actions = {
  [ACTION.SET_FILTERS]: async ({ request }) => {
    const form_data = await request.formData()
    const [set_filters_errors, set_filters_data] =
      await set_filters(request, form_data)
    if (set_filters_errors) {
      return { errors: set_filters_errors }
    }
    redirect(303, set_filters_data.redirect_to)
  },
}
