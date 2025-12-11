import { concatenate_services } from "~/lib/contract/formatter.server"
import type { Props } from "~/lib/contract/pdf.server"

export function SectionNine({
  contract,
}: {
  contract: Props
}) {
  return `Son a cargo exclusivo de "EL LOCADOR" el pago de todos los impuestos que graven el inmueble locado; sean nacionales, provinciales y/o municipales, con sus respectivos reajustes y adicionales. Son cargo exclusivo de "EL LOCATARIO" la totalidad de los servicios correspondientes tales como: ${concatenate_services(contract.services)}, expensas ordinarias y cualquier servicio que en el futuro se creare o instalare, y que gravare al inmueble y/o a los servicios de los que se sirve. "EL LOCADOR" abonará las expensas extraordinarias.`
}
