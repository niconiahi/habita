<script lang="ts">
  import * as v from "valibot"
  import { get_day, get_month, get_year } from "$lib/date"
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
  interface Props {
    contract: NonNullable<Contract>
  }
  let { contract }: Props = $props()
  const start_date = $derived(
    v.parse(v.date(), contract.start_date),
  )
  const end_date = $derived(
    v.parse(v.date(), contract.end_date),
  )
</script>

<p>
  El plazo de esta locación se conviene en el período
  comprendido desde el día <strong
    >{get_day(start_date)}/{get_month(
      start_date,
      "word",
    )}/{get_year(start_date)}</strong
  >, fecha en la que <strong>"EL LOCADOR"</strong>
  entrega el inmueble a <strong>"EL LOCATARIO"</strong>, o
  sea que, su vencimiento opera de pleno derecho el día
  <strong
    >{get_day(end_date)}/{get_month(
      end_date,
      "word",
    )}/{get_year(end_date)}</strong
  >. En esa fecha <strong>"EL LOCATARIO"</strong> deberá
  desocupar el inmueble objeto del presente contrato, y
  entregarlo en las mismas condiciones en la que fue
  recibido. Dentro de los 5 días previos a la finalización
  del contrato, <strong>"EL LOCADOR"</strong> podrá efectuar
  por sí mismo o por medio de quien autorice, a realizar una
  inspección del inmueble a fin de revelar su estado,
  quedando <strong>"EL LOCATARIO"</strong> obligado a
  realizar los arreglos y/o reposiciones de lo deteriorado
  con anticipación a la fecha en la que finaliza el presente
  contrato, devengándose el canon locativo hasta el día en
  el que se realice la entrega efectiva del inmueble en las
  condiciones pactadas. Si al entregar las llaves y el
  inmueble locado, se comprobare la existencia de faltantes,
  averías, obstrucciones, o cualquier tipo de desperfecto
  cuya reparación o reposición se encuentre en cabeza de
  <strong>"EL LOCATARIO"</strong>, este queda obligado a
  satisfacer el importe del alquiler mensual por el tiempo
  necesario, hasta que el inmueble se encuentre en las
  condiciones convenidas. Consecuentemente la relación
  contractual quedará concluida una vez que
  <strong>"EL LOCATARIO"</strong> haya dado fiel cumplimiento
  a todas las obligaciones que el presente contrato y la ley ponen
  a su cargo.
</p>
