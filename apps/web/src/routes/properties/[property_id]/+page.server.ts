import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { get_img_props } from "$lib/server/image"
import { PROPERTY_STATE } from "$lib/property_state"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { fetch_property } from "../fetchers/property.server"
import { fetch_user_files } from "../fetchers/user_files.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals,
}) => {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const property = await fetch_property(property_id)
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
  const images_with_props = property.images.map(
    (image, index) => ({
      ...image,
      props: get_img_props(image.id, image.hash, {
        widths: [600, 1200],
        sizes: ["(max-width: 900px) 600px, 1200px"],
      }),
      alt: `Foto de la propiedad - imagen ${index + 1}`,
    }),
  )
  return {
    property: { ...property, images: images_with_props },
    has_credit_report,
  }
}
