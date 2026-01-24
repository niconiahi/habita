import { decrypt } from "$lib/server/encryption"
import { get_organization_admins } from "$lib/server/organization"

export async function fetch_admins_with_property_counts(
  organization_id: string,
) {
  const admins = await get_organization_admins(organization_id)

  return admins.map((admin) => ({
    ...admin,
    name: admin.name ? decrypt(admin.name) : null,
    surname: admin.surname ? decrypt(admin.surname) : null,
  }))
}

export type Admin = Awaited<
  ReturnType<typeof fetch_admins_with_property_counts>
>[number]
