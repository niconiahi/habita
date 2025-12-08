import { Link } from "react-router"
import * as v from "valibot"
import "~/components/button.css"
import { Content } from "~/components/content"
import { Section } from "~/components/section"
import { RoomMap } from "~/components/room_map"
import { ForceNumberSchema } from "~/lib/force_number"
import { get_auth } from "~/lib/auth.server"
import { USER_FILE_TYPE } from "~/lib/user_file_type"
import { fetch_property } from "../fetchers/property.server"
import { fetch_user_files } from "../fetchers/user_files.server"
import type { Route } from "./+types/_index"

export async function action({ params }: Route.LoaderArgs) {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${property_id}`,
    )
  }
  return { property }
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${property_id}`,
    )
  }
  const { user } = await get_auth(request)
  let has_credit_report = false
  if (user) {
    const user_files = await fetch_user_files(user.id)
    has_credit_report = user_files.some(
      (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT
    )
  }
  return { property, has_credit_report }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { property, has_credit_report } = loaderData
  return (
    <Content.Root>
      <Content.Title>Propiedad</Content.Title>
      <Content.Section>
        la propiedad ubicada en {property.location.road}{" "}
        {property.location.house_number}{" "}
        <Link to={has_credit_report ? "book" : "book/restricted"} className="button">Reservar</Link>
      </Content.Section>
      <Content.Section>
        <Section.Header>
          <Section.Title>mapa de ambientes</Section.Title>
        </Section.Header>
        <RoomMap rooms={property.rooms} is_readonly={true} />
      </Content.Section>
    </Content.Root>
  )
}
