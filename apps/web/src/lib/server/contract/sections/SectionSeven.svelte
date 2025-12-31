<script lang="ts">
  import * as v from "valibot"
  import n2words from "n2words"
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
  import { get_escalation_label } from "$lib/escalation_type"
  import { get_duration_label } from "$lib/duration"
  interface Props {
    contract: Contract
  }
  let { contract }: Props = $props()
  function get_price_in_words(price: number): string {
    return n2words(price, {
      lang: "es",
    }).toLocaleUpperCase()
  }
  const initial_price = $derived(contract?.periods[0].price)
  const duration = $derived(
    v.parse(
      v.string("A escalation duration is needed"),
      contract.escalation_duration,
    ),
  )
  const type = $derived(
    v.parse(
      v.number("A escalation type is needed"),
      contract.escalation_type,
    ),
  )
</script>

<p>
  Las partes convienen que <strong>"EL LOCATARIO"</strong>
  abonará a <strong>"EL LOCADOR"</strong> un canon locativo
  de PESOS
  <strong
    >{get_price_in_words(initial_price)} (${initial_price})</strong
  >
  mensuales para el primer período de contrato. El canon se ajustará
  cada
  <strong>{get_duration_label(duration)}</strong>
  utilizando el índice
  <strong>{get_escalation_label(type)}</strong>, que será
  publicado por la entidad correspondiente, de forma
  acumulativa y aplicando el aumento porcentual total al
  valor del último período. En todos los casos el canon se
  pacta por períodos de mes entero y aunque
  <strong>"EL LOCATARIO"</strong>
  hiciera entrega del inmueble antes de finalizar el mes, pagará
  íntegramente el canon correspondiente a ese mes.
</p>
