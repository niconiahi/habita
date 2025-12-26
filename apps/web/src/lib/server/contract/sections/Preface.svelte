<script lang="ts">
  import * as v from "valibot"
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
  import type { Owner } from "../../owner"
  import type { Tenant } from "../../tenant"
  interface Props {
    contract: NonNullable<Contract>
    tenant: NonNullable<Tenant>
    owner: NonNullable<Owner>
  }
  let { owner, tenant, contract }: Props = $props()
  const LocationSchema = v.object({
    house_number: v.number("House number must be a number"),
    road: v.string("Street must be exist"),
    state: v.nullable(v.string("It's a message state")),
    suburb: v.nullable(v.string("It's a message suburb")),
    city: v.nullable(v.string("It's a message city")),
  })
  const owner_location = $derived(
    v.parse(LocationSchema, contract.owner_location),
  )
  const tenant_location = $derived(
    v.parse(LocationSchema, contract.tenant_location),
  )
</script>

<p>
  Entre el Sr/a. {owner.name}
  {owner.surname.toLocaleUpperCase()} con DNI {owner.document_number},
  con domicilio en {owner_location.road}
  {owner_location.house_number}, {owner_location.state}, en
  adelante llamado "EL LOCADOR", por una parte, y el Sr/a. {tenant.name}
  {tenant.surname.toLocaleUpperCase()} con DNI {tenant.document_number},
  con domicilio en {tenant_location.road}
  {tenant_location.house_number}, {tenant_location.state},
  en adelante llamado "EL LOCATARIO", por la otra, siendo
  ambas partes mayores de edad y hábiles para contratar,
  convienen celebrar el siguiente contrato de locación que
  se regirá por el Código Civil y Comercial de la Nación,
  normativa aplicable a la materia y las siguientes
  clausulas y condiciones:
</p>
