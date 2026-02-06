import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"

export async function fetch_warranty(warranty_id: number | null) {
  if (!warranty_id) return null
  const result = await query_builder
    .selectFrom("warranty")
    .select((eb) => [
      "warranty.id",
      "warranty.type",
      jsonObjectFrom(
        eb
          .selectFrom("property_warranty")
          .innerJoin("location", "location.id", "property_warranty.location_id")
          .select([
            "property_warranty.id",
            "property_warranty.guarantor_name",
            "property_warranty.guarantor_dni",
            "property_warranty.guarantor_email",
            "property_warranty.location_id",
            "property_warranty.cadastral_district",
            "property_warranty.cadastral_section",
            "property_warranty.cadastral_block",
            "property_warranty.cadastral_parcel",
            "property_warranty.property_tax_id",
            "location.road",
            "location.house_number",
            "location.suburb",
            "location.city",
            "location.town",
            "location.state",
            "location.latitude",
            "location.longitude",
          ])
          .whereRef("property_warranty.warranty_id", "=", "warranty.id"),
      ).as("property_warranty"),
      jsonObjectFrom(
        eb
          .selectFrom("income_warranty")
          .select((eb2) => [
            "income_warranty.id",
            jsonArrayFrom(
              eb2
                .selectFrom("income_warranty_guarantor")
                .select([
                  "income_warranty_guarantor.id",
                  "income_warranty_guarantor.guarantor_name",
                  "income_warranty_guarantor.guarantor_dni",
                  "income_warranty_guarantor.guarantor_email",
                ])
                .whereRef(
                  "income_warranty_guarantor.income_warranty_id",
                  "=",
                  "income_warranty.id",
                ),
            ).as("guarantors"),
          ])
          .whereRef("income_warranty.warranty_id", "=", "warranty.id"),
      ).as("income_warranty"),
      jsonObjectFrom(
        eb
          .selectFrom("surety_warranty")
          .select([
            "surety_warranty.id",
            "surety_warranty.guarantor_name",
            "surety_warranty.guarantor_dni",
            "surety_warranty.guarantor_email",
            "surety_warranty.company_name",
            "surety_warranty.policy_number",
            "surety_warranty.company_email",
          ])
          .whereRef("surety_warranty.warranty_id", "=", "warranty.id"),
      ).as("surety_warranty"),
    ])
    .where("warranty.id", "=", warranty_id)
    .executeTakeFirst()
  return result ?? null
}

export type Warranty = NonNullable<
  Awaited<ReturnType<typeof fetch_warranty>>
>
