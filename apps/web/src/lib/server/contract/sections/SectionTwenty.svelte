<script lang="ts">
  import * as v from "valibot"
  import type { Property } from "../../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
  import type { Owner } from "../../owner"
  import type { Tenant } from "../../tenant"
  interface Props {
    property: NonNullable<Property>
    contract: NonNullable<Contract>
    tenant: NonNullable<Tenant>
    owner: NonNullable<Owner>
  }
  let { owner, tenant, contract, property }: Props =
    $props()
  const LocationSchema = v.object({
    house_number: v.number("House number must be a number"),
    road: v.string("Street must be exist"),
    state: v.nullable(v.string("It's a message state")),
    suburb: v.nullable(v.string("It's a message suburb")),
    city: v.nullable(v.string("It's a message city")),
  })
  const owner_location = $derived(
    v.parse(
      v.nonNullish(LocationSchema),
      contract.owner_location,
    ),
  )
  const tenant_location = $derived(
    v.parse(
      v.nonNullish(LocationSchema),
      contract.tenant_location,
    ),
  )
</script>

<p>
  Las partes establecen los siguientes domicilios para todo
  lo relativo al presente contrato: "EL LOCADOR" en la calle {owner_location.road}
  {owner_location.house_number}, {owner_location.state}.
  Teléfono: {owner.phone_number}. "EL LOCATARIO" en la calle {tenant_location.road}
  {tenant_location.house_number}, unidad {property.unit}, {tenant_location.state}.
  Teléfono: {tenant.phone_number}. LAS PARTES convienen que
  las comunicaciones y emplazamientos entre sí, con motivo
  del presente contrato se efectuarán por cualquier medio
  fehaciente. Las notificaciones cursadas de este modo se
  tendrán por válidas y plenamente eficaces (Art. 75, Código
  Civil y Comercial). Todos los cambios de domicilio deberán
  ser comunicados a las demás partes por telegrama, carta
  documento, o cualquier otro medio idóneo, dentro de las
  cuarenta y ocho (48) horas de producido dicho cambio,
  siendo válidas las comunicaciones dirigidas al anterior
  hasta tanto dicha notificación se produzca.
</p>
