import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { USER_FILE_TYPE } from "$lib/user_file_type"

export function fetch_tenant_insurance_files(
  property_id: number,
) {
  return query_builder
    .selectFrom("user_file")
    .innerJoin("file", "file.id", "user_file.file_id")
    .innerJoin("user", "user.id", "user_file.user_id")
    .innerJoin(
      "property_access",
      "property_access.user_id",
      "user.id",
    )
    .where("property_access.property_id", "=", property_id)
    .where("property_access.type", "=", ACCESS_TYPE.TENANT)
    .where("user_file.type", "=", USER_FILE_TYPE.INSURANCE)
    .select(["file.id", "file.basename"])
    .execute()
}
