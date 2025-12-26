import { render } from "svelte/server"
import Contract from "./Contract.svx"
import { fetch_owner } from "$lib/server/owner"
import { fetch_tenant } from "$lib/server/tenant"

import { fetch_contract } from "../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
import { fetch_property } from "../../../routes/properties/fetchers/property.server"

export async function compose_html(
  property_id: number,
  contract_id: number,
): Promise<string> {
  const [contract, property, owner, tenant] =
    await Promise.all([
      fetch_contract(contract_id),
      fetch_property(property_id),
      fetch_owner(property_id),
      fetch_tenant(property_id),
    ])
  if (!contract) {
    throw new Error(
      "contract should exist when creating pdf",
    )
  }
  if (!property) {
    throw new Error(
      "property should exist when creating pdf",
    )
  }
  if (!owner) {
    throw new Error("owner should exist when creating pdf")
  }
  if (!tenant) {
    throw new Error("tenant should exist when creating pdf")
  }
  const first_period = contract.periods[0]
  if (!first_period) {
    throw new Error(
      "contract should have at least one period when creating contract to know initial price",
    )
  }

  const { body, head } = render(Contract, {
    props: { contract, property, owner, tenant },
  })
  return `<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="utf-8" />
		${head}
		<style>
			body {
				font-family: "Times New Roman", serif;
				padding: 40px 60px;
				line-height: 1.6;
				font-size: 12pt;
				max-width: 800px;
				margin: 0 auto;
			}
			h1 {
				text-align: center;
				font-size: 18pt;
				margin-bottom: 30px;
			}
			h2 {
				font-size: 14pt;
				margin-top: 24px;
				margin-bottom: 12px;
			}
			p {
				text-align: justify;
				margin: 10px 0;
			}
		</style>
	</head>
	<body>
		${body}
	</body>
</html>`
}

// const props: ContractProps = {
//     start_date: contract.start_date?.toISOString() ?? "",
//     end_date: contract.end_date?.toISOString() ?? "",
//     owner: {
//       name: owner.name ?? "",
//       surname: owner.surname ?? "",
//       phone_number: owner.phone_number ?? "",
//       document_number: owner.document_number ?? 0,
//     },
//     tenant: {
//       name: tenant.name ?? "",
//       surname: tenant.surname ?? "",
//       phone_number: tenant.phone_number ?? "",
//       document_number: tenant.document_number ?? 0,
//     },
//     location: {
//       road: property.location.road ?? "",
//       house_number:
//         Number(property.location.house_number) || 0,
//       state: property.location.state ?? "",
//     },
//     owner_location: {
//       road: "A completar",
//       house_number: 0,
//       state: "A completar",
//     },
//     price: first_period.price ?? 0,
//     escalation: {
//       type: get_escalation_label(
//         contract.escalation_type ?? 0,
//       ),
//       duration: get_duration_label(
//         (contract.escalation_duration ?? "P3M") as Duration,
//       ),
//     },
//     fine: {
//       type: (contract.fine_type ?? 1) as FineType,
//       amount: Number(contract.fine_amount) || 0,
//       duration: (contract.default_duration ??
//         "P1D") as Duration,
//     },
//     default: {
//       type: (contract.default_type ?? 1) as DefaultType,
//       amount: Number(contract.default_amount) || 0,
//     },
//     property: {
//       unit: property.unit ?? "",
//     },
//     services: property.services.map((s) => ({
//       id: s.id,
//       type: s.type,
//       code: s.code ?? "",
//     })),
//   }
