import { useLoaderData } from "react-router"
import * as v from "valibot"
import { Content } from "~/components/content"
import { Section } from "~/components/section"
import { ACCESS_TYPE } from "~/lib/access_type"
import { require_auth } from "~/lib/auth.server"
import { display_name } from "~/lib/display_name"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { query_builder } from "~/lib/query_builder.server"
import { SLOT_STATE } from "~/lib/slot_state"
import { fetch_candidate } from "../fetchers/candidate.server"
import type { Route } from "./+types/_index"

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const candidate_id = v.parse(
    ForceNumberSchema,
    params.candidate_id,
    {
      message: "candidate id should be a number",
    },
  )
  const property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  const candidate_slot = await query_builder
    .selectFrom("slot")
    .where("slot.visitant_id", "=", candidate_id)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .where("slot.property_id", "in", property_ids)
    .select(["slot.id"])
    .executeTakeFirst()
  if (!candidate_slot) {
    throw error(403, "not authorized")
  }
  const candidate = await fetch_candidate(candidate_id)
  if (!candidate) {
    throw error(404, "candidate not found")
  }
  return { candidate }
}

export default function () {
  const { candidate } = useLoaderData<typeof loader>()
  return (
    <Content.Root>
      <Content.Title>
        {display_name(candidate)}
      </Content.Title>
      <Content.Section>
        <Section.Header>
          <Section.Title>
            Información de contacto
          </Section.Title>
        </Section.Header>
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Nombre</p>
            <p>{display_name(candidate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Email</p>
            <p>{candidate.email}</p>
          </div>
          {candidate.phone_number && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                Teléfono
              </p>
              <p>{candidate.phone_number}</p>
            </div>
          )}
        </div>
      </Content.Section>
    </Content.Root>
  )
}
