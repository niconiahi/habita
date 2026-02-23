import { check_certificate } from "$lib/server/digital_signature"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"

export async function check_certificates(
  property_id: number,
) {
  const [landlord, tenant] = await Promise.all([
    fetch_landlord(property_id),
    fetch_tenant(property_id),
  ])
  if (!landlord?.cuil) {
    return {
      errors: {
        check_certificates:
          "El locador no tiene CUIL configurado",
      },
    }
  }
  if (!tenant?.cuil) {
    return {
      errors: {
        check_certificates:
          "El locatario no tiene CUIL configurado",
      },
    }
  }
  const [landlord_result, tenant_result] =
    await Promise.allSettled([
      check_certificate(landlord.cuil),
      check_certificate(tenant.cuil),
    ])
  return {
    landlord_has_cert:
      landlord_result.status === "fulfilled" &&
      landlord_result.value.CodigoResultado === 1,
    tenant_has_cert:
      tenant_result.status === "fulfilled" &&
      tenant_result.value.CodigoResultado === 1,
  }
}
