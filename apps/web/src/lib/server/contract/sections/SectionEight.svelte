<script lang="ts">
  import type { Contract } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
  interface Props {
    contract: Contract
  }
  let { contract }: Props = $props()
</script>

<p>
  El importe del alquiler será abonado por <strong
    >"EL LOCATARIO"</strong
  >
  en forma mensual y consecutiva, mediante pago en EFECTIVO,
  por período adelantado, del 1 al 5 de cada mes a
  <strong>"EL LOCADOR"</strong>, o quien autorice el mismo a
  que lo represente, hecho que se notificará al
  <strong>"EL LOCATARIO"</strong>
  por cualquier medio fehaciente. La mora en el pago de los
  alquileres se producirá en forma automática, por el mero
  vencimiento del término convenido, por lo que, si
  <strong>"EL LOCATARIO"</strong>
  no abonare el alquiler en forma establecida ni en las
  fechas fijadas. Producida la mora, los alquileres siempre
  deberán abonarse con un interés compensatorio del
  <strong>{contract.fine_amount}%</strong>
  acumulativo. Para estos casos se aplicará la tasa activa cartera
  general (préstamos) nominal anual vencida a 30 días del Banco
  Nación. Los intereses se devengarán desde el día del vencimiento
  del plazo de pago del canon locativo hasta el momento donde
  efectivamente <strong>"EL LOCADOR"</strong>
  perciba el total de la suma correspondiente al pago. De verse
  obligado <strong>"EL LOCADOR"</strong> a intimar y/o
  iniciar juicio alguno contra
  <strong>"EL LOCATARIO"</strong>
  para obtener el cobro de las obligaciones contraídas, éste
  último deberá abonar, además del alquiler pactado, los
  gastos y honorarios que se devengaren por ello. Se deja
  establecido que la falta de pago de dos mensualidades
  consecutivas, como así también el incumplimiento de
  cualquier de las obligaciones establecidas mediante el
  presente contrato por parte de
  <strong>"EL LOCATARIO"</strong>, faculta a
  <strong>"EL LOCADOR"</strong> para declarar resuelto el mismo,
  solicitando el desalojo por vía judicial, sin perjuicio de otras
  penalidades que pudieren corresponder.
</p>
