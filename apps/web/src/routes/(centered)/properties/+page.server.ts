import { redirect } from "@sveltejs/kit"
import { display_location } from "$lib/display_location"
import { fetch_properties } from "$lib/server/fetchers/properties"
import { fetch_zones } from "$lib/server/fetchers/zones"
import { get_img_props } from "$lib/server/image"
import { ROOM_TYPE } from "$lib/room_type"
import { display_escalation } from "$lib/display_escalation"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import {
  parse_filters,
  parse_service_types,
  parse_tag_types,
  set_filters,
} from "./actions/set_filters.server"

export const load: PageServerLoad = async ({ url }) => {
  const filters = parse_filters(url)
  const tag_types = parse_tag_types(filters.tags)
  const service_types = parse_service_types(
    filters.services,
  )
  const [properties, zones] = await Promise.all([
    fetch_properties({
      zone_id: filters.zone_id,
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
    }),
    fetch_zones(),
  ])
  const zone_items = zones.map((zone) => ({
    id: zone.id,
    label: zone.label,
    badge: zone.badge,
  }))
  const selected_zone = filters.zone_id
    ? (zone_items.find(
        (zone) => zone.id === filters.zone_id,
      ) ?? null)
    : null
  const properties_with_display = properties.map(
    (property) => {
      const contract = property.contracts[0]
      const room_count = property.rooms.length
      const total_surface = Math.round(
        property.rooms.reduce(
          (sum, room) => sum + Number(room.width) * Number(room.length),
          0,
        ),
      )
      const bathroom_count = property.rooms.filter(
        (room) => room.type === ROOM_TYPE.BATHROOM,
      ).length
      return {
        id: property.id,
        location: display_location(property.location),
        price: contract?.current_price ?? null,
        escalation:
          contract?.escalation_type !== null &&
          contract?.escalation_type !== undefined &&
          contract?.escalation_duration
            ? display_escalation(
                contract.escalation_type,
                contract.escalation_duration,
              )
            : null,
        room_count,
        total_surface,
        bathroom_count,
        images: property.images.map((image, index) => {
          const props = get_img_props(image.id, image.hash, {
            widths: [400, 800],
            sizes: [
              "(max-width: 600px) 400px, (max-width: 900px) 800px",
            ],
          })
          return {
            src: props.src,
            srcSet: props.srcSet,
            sizes: props.sizes,
            alt: `${display_location(property.location)} - imagen ${index + 1}`,
          }
        }),
      }
    },
  )
  return {
    properties: properties_with_display,
    filters,
    zone_items,
    selected_zone,
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
