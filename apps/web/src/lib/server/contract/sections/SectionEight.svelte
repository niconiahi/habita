<script lang="ts">
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
  interface Props {
    contract: Contract
  }
  let { contract }: Props = $props()
</script>

<p>
  El importe del alquiler será abonado por "EL LOCATARIO" en
  forma mensual y consecutiva, mediante pago en EFECTIVO,
  por período adelantado, del 1 al 5 de cada mes a "EL
  LOCADOR", o quien autorice el mismo a que lo represente,
  hecho que se notificará al "EL LOCATARIO" por cualquier
  medio fehaciente. La mora en el pago de los alquileres se
  producirá en forma automática, por el mero vencimiento del
  término convenido, por lo que, si "EL LOCATARIO" no
  abonare el alquiler en forma establecida ni en las fechas
  fijadas. Producida la mora, los alquileres siempre deberán
  abonarse con un interés compensatorio del {contract.fine_amount}%
  acumulativo. Para estos casos se aplicará la tasa activa
  cartera general (préstamos) nominal anual vencida a 30
  días del Banco Nación. Los intereses se devengarán desde
  el día del vencimiento del plazo de pago del canon
  locativo hasta el momento donde efectivamente "EL LOCADOR"
  perciba el total de la suma correspondiente al pago. De
  verse obligado "EL LOCADOR" a intimar y/o iniciar juicio
  alguno contra "EL LOCATARIO" para obtener el cobro de las
  obligaciones contraídas, éste último deberá abonar, además
  del alquiler pactado, los gastos y honorarios que se
  devengaren por ello. Se deja establecido que la falta de
  pago de dos mensualidades consecutivas, como así también
  el incumplimiento de cualquier de las obligaciones
  establecidas mediante el presente contrato por parte de
  "EL LOCATARIO", faculta a "EL LOCADOR" para declarar
  resuelto el mismo, solicitando el desalojo por vía
  judicial, sin perjuicio de otras penalidades que pudieren
  corresponder.
</p>
