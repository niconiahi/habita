import {
  get_day,
  get_month,
  get_year,
} from "~/lib/contract/formatter.server"
import type { Props } from "~/lib/contract/pdf.server"

export function SectionSix({
  contract,
}: {
  contract: Props
}) {
  return `El plazo de esta locación se conviene en el período comprendido desde el día ${get_day(contract.start_date)}/${get_month(contract.start_date)}/${get_year(contract.start_date)}, fecha en la que "EL LOCADOR" entrega el inmueble a "EL LOCATARIO", o sea que, su vencimiento opera de pleno derecho el día ${get_day(contract.end_date)}/${get_month(contract.end_date)}/${get_year(contract.end_date)}. En esa fecha "EL LOCATARIO" deberá desocupar el inmueble objeto del presente contrato, y entregarlo en las mismas condiciones en la que fue recibido. Dentro de los 5 días previos a la finalización del contrato, "EL LOCADOR" podrá efectuar por sí mismo o por medio de quien autorice, a realizar una inspección del inmueble a fin de revelar su estado, quedando "EL LOCATARIO" obligado a realizar los arreglos y/o reposiciones de lo deteriorado con anticipación a la fecha en la que finaliza el presente contrato, devengándose el canon locativo hasta el día en el que se realice la entrega efectiva del inmueble en las condiciones pactadas. Si al entregar las llaves y el inmueble locado, se comprobare la existencia de faltantes, averías, obstrucciones, o cualquier tipo de desperfecto cuya reparación o reposición se encuentre en cabeza de "EL LOCATARIO", este queda obligado a satisfacer el importe del alquiler mensual por el tiempo necesario, hasta que el inmueble se encuentre en las condiciones convenidas. Consecuentemente la relación contractual quedará concluida una vez que "EL LOCATARIO" haya dado fiel cumplimiento a todas las obligaciones que el presente contrato y la ley ponen a su cargo.`
}
