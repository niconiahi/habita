import n2words from "n2words"
import type { Props } from "~/lib/contract/pdf.server"

export function SectionSeven({
  contract,
}: {
  contract: Props
}) {
  return `Las partes convienen que "EL LOCATARIO" abonará a "EL LOCADOR" un canon locativo de PESOS ${n2words(contract.price, { lang: "es" }).toLocaleUpperCase()} ($${contract.price}) mensuales para el primer período de contrato. El canon se ajustará cada ${contract.escalation.duration} utilizando el índice ${contract.escalation.type}, que será publicado por la entidad correspondiente, de forma acumulativa y aplicando el aumento porcentual total al valor del último período. En todos los casos el canon se pacta por períodos de mes entero y aunque "EL LOCATARIO" hiciera entrega del inmueble antes de finalizar el mes, pagará íntegramente el canon correspondiente a ese mes.`
}
