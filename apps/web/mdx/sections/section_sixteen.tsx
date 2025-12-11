import type { Props } from "~/lib/contract/pdf.server"

export function SectionSixteen({
  contract,
}: {
  contract: Props
}) {
  return `(ART 1221 DEL C.C Y C). "EL LOCATARIO" podrá, transcurrido el primer mes de vigencia de la relación locativa, resolver la contratación, debiendo notificar su decisión a "EL LOCADOR" con una antelación mínima de diez días, donde deberá abonar a "EL LOCADOR" en concepto de indemnización la suma equivalente a $${contract.default.amount} al momento de desocupar la vivienda.`
}
