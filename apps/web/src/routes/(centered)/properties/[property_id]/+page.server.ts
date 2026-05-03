import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { get_img_props } from "$lib/server/image"
import { fetch_manager } from "$lib/server/manager"
import { get_user_realtor_organization } from "$lib/server/organization"
import { PROPERTY_STATE } from "$lib/property_state"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { fetch_property } from "../../../properties/fetchers/property.server"
import { fetch_user_files } from "../../../properties/fetchers/user_files.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals,
}) => {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const [property, manager] = await Promise.all([
    fetch_property(property_id),
    fetch_manager(property_id),
  ])
  if (!property) {
    error(404, "not found")
  }
  if (property.state !== PROPERTY_STATE.PUBLISHED) {
    error(404, "not found")
  }
  let has_credit_report = false
  if (locals.user) {
    const user_files = await fetch_user_files(
      locals.user.id,
    )
    has_credit_report = user_files.some(
      (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT,
    )
  }
  const organization = manager
    ? await get_user_realtor_organization(manager.id)
    : undefined
  const floors_with_photo_urls = property.floors.map(
    (floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        photos: room.photos.map((photo) => ({
          ...photo,
          src: get_img_props(photo.id, photo.hash, {
            widths: [600, 1200],
            sizes: ["(max-width: 900px) 600px, 1200px"],
          }).src,
        })),
      })),
    }),
  )
  const images = floors_with_photo_urls.flatMap((floor) =>
    floor.rooms.flatMap((room) =>
      room.photos.map((photo) => ({
        ...photo,
        props: get_img_props(photo.id, photo.hash, {
          widths: [600, 1200],
          sizes: ["(max-width: 900px) 600px, 1200px"],
        }),
        alt: `Foto de la propiedad - ${photo.basename}`,
      })),
    ),
  )
  return {
    property: {
      ...property,
      floors: floors_with_photo_urls,
      images,
    },
    has_credit_report,
    manager,
    organization,
  }
}
