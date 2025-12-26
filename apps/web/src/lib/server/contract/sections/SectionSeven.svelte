<script lang="ts">
  import n2words from "n2words"
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
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
</script>

<p>
  Las partes convienen que "EL LOCATARIO" abonará a "EL
  LOCADOR" un canon locativo de PESOS {get_price_in_words(
    initial_price,
  )} (${initial_price}) mensuales para el primer período de
  contrato. El canon se ajustará cada {contract.escalation_duration}
  utilizando el índice {contract.escalation_type}, que será
  publicado por la entidad correspondiente, de forma
  acumulativa y aplicando el aumento porcentual total al
  valor del último período. En todos los casos el canon se
  pacta por períodos de mes entero y aunque "EL LOCATARIO"
  hiciera entrega del inmueble antes de finalizar el mes,
  pagará íntegramente el canon correspondiente a ese mes.
</p>
