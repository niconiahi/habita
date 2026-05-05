import { fail } from "@sveltejs/kit"
import {
  ApiFetchError,
  check_certificate,
} from "$lib/server/digital_signature"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { logger } from "$lib/telemetry/logger"

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

  let landlord_has_cert = false
  let tenant_has_cert = false

  try {
    const landlord_cert = await check_certificate(
      landlord.cuil,
    )
    landlord_has_cert =
      landlord_cert.CodigoResultado === 1
  } catch (error) {
    if (error instanceof ApiFetchError) {
      landlord_has_cert = false
    } else {
      logger.unknown(error)
    }
  }

  try {
    const tenant_cert = await check_certificate(
      tenant.cuil,
    )
    tenant_has_cert = tenant_cert.CodigoResultado === 1
  } catch (error) {
    if (error instanceof ApiFetchError) {
      tenant_has_cert = false
    } else {
      logger.unknown(error)
    }
  }

  return {
    landlord_has_cert,
    tenant_has_cert,
  }
}
