import { fetch_properties } from "$lib/server/fetchers/properties";
import { get_img_props } from "$lib/server/image";
import { display_location } from "$lib/display_location";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const properties = await fetch_properties();

  const properties_with_image_props = properties.map((property) => ({
    ...property,
    images: property.images.map((image, index) => ({
      ...image,
      props: get_img_props(image.id, image.hash, {
        widths: [400, 800],
        sizes: ["(max-width: 600px) 400px, (max-width: 900px) 800px"]
      }),
      alt: `property at ${display_location(property.location)} - image ${index + 1}`
    }))
  }));

  return { properties: properties_with_image_props };
};
