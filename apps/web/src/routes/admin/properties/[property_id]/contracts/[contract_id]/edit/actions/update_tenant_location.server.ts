import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { LocationSchema } from "$lib/components/LocationInput.schemas"
import { ForceNumberSchema } from "$lib/force_number"
import { encrypt } from "$lib/server/encryption"
import { compose_point } from "$lib/server/point"

export async function update_tenant_location(
  form_data: FormData,
) {
  const contract_id = v.parse(
    ForceNumberSchema,
    form_data.get("contract_id"),
  )
  const location_ = v.parse(
    LocationSchema,
    JSON.parse(form_data.get("location") as string),
  )
  const now = new Date().toISOString()

  await query_builder.transaction().execute(async (tx) => {
    const location = await tx
      .insertInto("location")
      .values({
        latitude: location_.lat,
        longitude: location_.lon,
        road: location_.address.road,
        house_number: location_.address.house_number,
        suburb: location_.address.suburb,
        town: location_.address.town,
        city: location_.address.city,
        state: location_.address.state,
        point: compose_point(location_.lat, location_.lon),
        address: location_.display_name,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    await tx
      .updateTable("contract")
      .set({
        tenant_location_id: encrypt(String(location.id)),
        updated_at: now,
      })
      .where("contract.id", "=", contract_id)
      .execute()
  })
}
