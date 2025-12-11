import type { Props } from "~/lib/contract/pdf.server"

export function SectionOne({
  contract,
}: {
  contract: Props
}) {
  return `"EL LOCADOR" da la locación a "EL LOCATARIO" y este acepta de conformidad, un inmueble de su propiedad, ubicado en la calle ${contract.location.road} ${contract.location.house_number}, unidad ${contract.property.unit}, de la Ciudad de ${contract.location.state}, Argentina, con la posibilidad de utilizar una cochera cubierta ubicada en dicho domicilio.`
}
