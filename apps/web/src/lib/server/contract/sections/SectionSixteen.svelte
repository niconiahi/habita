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
  let { contract }: Props = $props()
  const price = $derived(
    v.parse(v.number(), contract.periods[0].price),
  )
</script>

<p>
  (ART 1221 DEL C.C Y C). <strong>"EL LOCATARIO"</strong>
  podrá, transcurrido el primer mes de vigencia de la
  relación locativa, resolver la contratación, debiendo
  notificar su decisión a
  <strong>"EL LOCADOR"</strong> con una antelación mínima de
  diez días, donde deberá abonar a
  <strong>"EL LOCADOR"</strong>
  en concepto de indemnización la suma equivalente a
  <strong>${price}</strong> al momento de desocupar la vivienda.
</p>
