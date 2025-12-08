import { useLoaderData } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { query_builder } from "db/query_builder"
import { SLOT_STATE } from "~/lib/slot_state"
import { ForceNumberSchema } from "~/lib/force_number"
import {
  get_property_accesses,
  require_edit_access,
} from "~/lib/property_access.server"
import { fetch_property } from "~/routes/properties+/fetchers/property.server"
import { display_location } from "~/lib/display_location"
import { Content } from "~/components/content"
import type { Route } from "./+types/_index"

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const property_accesses = get_property_accesses(
    user,
    property_id,
  )
  require_edit_access(property_accesses)

  const [candidates, property] = await Promise.all([
    fetch_candidates(property_id),
    fetch_property(property_id),
  ])

  if (!property) {
    throw error(404, "property not found")
  }

  return { candidates, property }
}

export default function PropertyCandidates() {
  const { candidates, property } =
    useLoaderData<typeof loader>()
  return (
    <Content.Root>
      <Content.Title>Candidatos</Content.Title>
      <Content.Section>
        <p className="text-gray-600">
          {display_location(property.location)}
        </p>
        {candidates.length === 0 ? (
          <p>No hay candidatos para revisar.</p>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const full_name = [
                candidate.name,
                candidate.surname,
              ]
                .filter(Boolean)
                .join(" ")
              return (
                <div
                  key={candidate.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      {full_name || "Sin nombre"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {candidate.email}
                    </p>
                    {candidate.phone_number && (
                      <p className="text-sm text-gray-600">
                        {candidate.phone_number}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Content.Section>
    </Content.Root>
  )
}

async function fetch_candidates(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .innerJoin("user", "user.id", "slot.visitant_id")
    .where("slot.property_id", "=", property_id)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .select([
      "user.id",
      "user.email",
      "user.name",
      "user.surname",
      "user.phone_number",
    ])
    .execute()
}
