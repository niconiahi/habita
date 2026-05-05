import { fail } from "@sveltejs/kit"
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
    return fail(400, {
      message: "El locador no tiene CUIL configurado",
    })
  }
  if (!tenant?.cuil) {
    return fail(400, {
      message: "El locatario no tiene CUIL configurado",
    })
  }
  const [
    [landlord_cert_error, landlord_cert],
    [tenant_cert_error, tenant_cert],
  ] = await Promise.all([
    check_certificate(landlord.cuil),
    check_certificate(tenant.cuil),
  ])
  return {
    landlord_has_cert:
      !landlord_cert_error &&
      landlord_cert.CodigoResultado === 1,
    tenant_has_cert:
      !tenant_cert_error &&
      tenant_cert.CodigoResultado === 1,
  }
}
