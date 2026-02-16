<script lang="ts">
  import { WARRANTY_TYPE } from "$lib/warranty_type"
  import type { Warranty } from "../../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/warranty.server"
  interface Props {
    warranty: Warranty
  }
  let { warranty }: Props = $props()
</script>

{#if warranty.type === WARRANTY_TYPE.PROPERTY && warranty.property_warranty}
  <p>
    El/La señor/a <strong
      >{warranty.property_warranty.guarantor_name}</strong
    >, D.N.I. {warranty.property_warranty.guarantor_dni},
    con domicilio electrónico en {warranty.property_warranty
      .guarantor_email}, en adelante
    <strong>"EL GARANTE"</strong>, se constituye en deudor
    solidario y principal pagador de las obligaciones que
    <strong>"EL LOCATARIO"</strong> contrae en el presente contrato
    y de las que se originen en eventuales incumplimientos suyos,
    renunciando expresamente a los beneficios de división y excusión.
  </p>
  <p>
    La garantía dada subsistirá por todo el tiempo en que <strong
      >"EL LOCATARIO"</strong
    >
    ocupe el inmueble y/o hasta que sea concluido cualquier proceso
    judicial que se origine con relación a la presente locación.
  </p>
  <p>
    En caso de desaparición física o insolvencia
    sobreviniente de <strong>"EL GARANTE"</strong>,
    <strong>"EL LOCADOR"</strong> podrá exigir a
    <strong>"EL LOCATARIO"</strong>
    una nueva fianza a su satisfacción, debiendo este último presentarla
    en un plazo no mayor de DIEZ (10) días del requerimiento expreso
    realizado por
    <strong>"EL LOCADOR"</strong>.
  </p>
  <p>
    El mismo procedimiento será aplicado en caso de que <strong
      >"EL GARANTE"</strong
    >
    modificare o restringiere su dominio sobre los bienes afectados
    a esta garantía, salvo que en el mismo plazo de DIEZ (10)
    días ofrecieren otro bien en sustitución a satisfacción de
    <strong>"EL LOCADOR"</strong>. El incumplimiento de esta
    cláusula por <strong>"EL LOCATARIO"</strong> y/o por
    <strong>"EL GARANTE"</strong>
    dará derecho a <strong>"EL LOCADOR"</strong> a dar por rescindido
    el contrato y requerir la restitución del bien.
  </p>
  <p>
    Afecta a esta garantía un inmueble ubicado en
    <strong
      >{warranty.property_warranty.road}
      {warranty.property_warranty.house_number}{warranty
        .property_warranty.suburb
        ? `, ${warranty.property_warranty.suburb}`
        : ""}{warranty.property_warranty.city
        ? `, ${warranty.property_warranty.city}`
        : ""}{warranty.property_warranty.town
        ? `, ${warranty.property_warranty.town}`
        : ""}{warranty.property_warranty.state
        ? `, ${warranty.property_warranty.state}`
        : ""}</strong
    >.
  </p>
  <p>
    <strong>NOMENCLATURA CATASTRAL:</strong>
    Circunscripción: {warranty.property_warranty
      .cadastral_district}; Sección: {warranty
      .property_warranty.cadastral_section}; Manzana: {warranty
      .property_warranty.cadastral_block}; Parcela: {warranty
      .property_warranty.cadastral_parcel}; Partida
    Inmobiliaria: {warranty.property_warranty
      .property_tax_id}.
  </p>
  <p>
    <strong>"EL GARANTE"</strong> declara bajo juramento no encontrarse
    inhibido/a ni registrar embargos, hipotecas ni ningún otro
    derecho que afecte su dominio sobre el inmueble afectado a
    esta garantía.
  </p>
{:else if warranty.type === WARRANTY_TYPE.INCOME && warranty.income_warranty}
  {#if warranty.income_warranty.guarantors && warranty.income_warranty.guarantors.length > 0}
    <p>
      {#each warranty.income_warranty.guarantors as guarantor, index (guarantor.id)}
        {#if index > 0},
        {/if}
        El/La señor/a
        <strong>{guarantor.guarantor_name}</strong>, D.N.I. {guarantor.guarantor_dni},
        con domicilio electrónico en {guarantor.guarantor_email}
      {/each}, en adelante {warranty.income_warranty
        .guarantors.length > 1
        ? '"LOS GARANTES"'
        : '"EL GARANTE"'}, se {warranty.income_warranty
        .guarantors.length > 1
        ? "constituyen"
        : "constituye"} en fiador{warranty.income_warranty
        .guarantors.length > 1
        ? "es"
        : ""} solidario{warranty.income_warranty.guarantors
        .length > 1
        ? "s"
        : ""}, liso{warranty.income_warranty.guarantors
        .length > 1
        ? "s"
        : ""}, llano{warranty.income_warranty.guarantors
        .length > 1
        ? "s"
        : ""}
      y principal{warranty.income_warranty.guarantors
        .length > 1
        ? "es"
        : ""} pagador{warranty.income_warranty.guarantors
        .length > 1
        ? "es"
        : ""}
      respecto de todas y cada una de las obligaciones que emergen
      de este contrato para
      <strong>"EL LOCATARIO"</strong>, durante todo el lapso
      de vigencia del mismo y hasta la efectiva restitución
      del inmueble objeto de locación a satisfacción de
      <strong>"EL LOCADOR"</strong>, renunciando en forma
      expresa a los beneficios de excusión y división.
    </p>
    <p>
      Se entienden comprendidas todas las sumas que <strong
        >"EL LOCATARIO"</strong
      >
      adeudare y/o indemnizaciones por daños y perjuicios consecuentes,
      incluidas las obligaciones correspondientes a pagos a efectuar
      por servicios, tasas, impuestos y expensas a su cargo del
      período de ocupación y los gastos de reparaciones y/o reposiciones
      que hubiere que efectuar.
    </p>
    <p>
      En caso de falencia, irresponsabilidad o fallecimiento
      de
      {warranty.income_warranty.guarantors.length > 1
        ? "los garantes"
        : "el garante"},
      <strong>"EL LOCADOR"</strong> podrá exigir en forma
      fehaciente en cualquier momento otra garantía en
      reemplazo de la presente y
      <strong>"EL LOCATARIO"</strong>
      deberá presentarla en el plazo de DIEZ (10) días corridos
      bajo pena de considerar rescindida la locación del inmueble.
    </p>
    <p>
      {#each warranty.income_warranty.guarantors as guarantor, index (guarantor.id)}
        {#if index > 0},
        {/if}
        {guarantor.guarantor_name}
      {/each}
      {warranty.income_warranty.guarantors.length > 1
        ? "declaran"
        : "declara"} conocer y aceptar todas las cláusulas de
      este contrato, acreditando su capacidad de pago mediante
      recibos de sueldo e informe comercial, documentación que
      queda en poder de <strong>"EL LOCADOR"</strong>.
    </p>
  {:else}
    <p>
      <strong
        >[GARANTES POR RECIBO DE SUELDO - SIN DATOS]</strong
      >
    </p>
  {/if}
{:else if warranty.type === WARRANTY_TYPE.SURETY && warranty.surety_warranty}
  <p>
    El/La señor/a <strong
      >{warranty.surety_warranty.guarantor_name}</strong
    >, D.N.I. {warranty.surety_warranty.guarantor_dni}, con
    domicilio electrónico en
    {warranty.surety_warranty.guarantor_email}, en adelante
    <strong>"EL FIADOR"</strong>, se constituye en fiador
    liso, llano, solidario y principal pagador respecto de
    todas y cada una de las obligaciones que emergen de este
    contrato para
    <strong>"EL LOCATARIO"</strong>, durante todo el lapso
    de vigencia del mismo y hasta la efectiva restitución
    del inmueble objeto de locación a satisfacción de
    <strong>"EL LOCADOR"</strong>, renunciando en forma
    expresa a los beneficios de excusión y división.
  </p>
  <p>
    Se entienden comprendidas todas las sumas que <strong
      >"EL LOCATARIO"</strong
    >
    adeudare y/o indemnizaciones por daños y perjuicios consecuentes,
    incluidas las obligaciones correspondientes a pagos a efectuar
    por servicios, tasas, impuestos y expensas a su cargo del
    período de ocupación y los gastos de reparaciones y/o reposiciones
    que hubiere que efectuar.
  </p>
  <p>
    En garantía del fiel y debido cumplimiento de las
    obligaciones contenidas en el presente contrato, <strong
      >"EL LOCATARIO"</strong
    >
    constituye un
    <strong>SEGURO DE CAUCIÓN</strong> de garantía de
    alquileres con intervención de
    <strong>{warranty.surety_warranty.company_name}</strong
    >, en adelante
    <strong>"LA ASEGURADORA"</strong>, con domicilio
    electrónico en
    {warranty.surety_warranty.company_email}, Póliza Nº
    <strong>{warranty.surety_warranty.policy_number}</strong
    >.
  </p>
  <p>
    Mediante dicho seguro, <strong>"LA ASEGURADORA"</strong
    >, acaecido el incumplimiento por
    <strong>"EL LOCATARIO"</strong>, garantiza a
    <strong>"EL LOCADOR"</strong> la debida percepción por éste
    del canon locativo previsto en este contrato y/o el que resultase
    de conformidad a las modificaciones que pudieren llegar a
    efectuarse, con más las cargas comunes y los gastos ocasionados
    por impuestos y/o servicios.
  </p>
  <p>
    El seguro de garantía referido es condición de esta
    locación, razón por la cual la tenencia del bien le será
    entregada a <strong>"EL LOCATARIO"</strong> una vez que se
    presente la correspondiente póliza. Deberá figurar expresamente
    en la póliza que los actos, declaraciones, acciones u omisiones
    del Tomador no afectan los derechos del Asegurado frente al
    Asegurador, y especialmente que la garantía subsiste aún cuando
    el Tomador se encuentre en mora en el pago de la prima.
  </p>
  <p>
    Asimismo, la póliza deberá obligar al asegurador a
    mantener su garantía hasta la extinción total de las
    obligaciones del Tomador.
  </p>
{:else}
  <p>
    <strong>[TIPO DE GARANTÍA NO RECONOCIDO]</strong>
  </p>
{/if}
