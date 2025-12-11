import type { Props } from "~/lib/contract/pdf.server"

export function SectionTwenty({
  contract,
}: {
  contract: Props
}) {
  return `Las partes establecen los siguientes domicilios para todo lo relativo al presente contrato: "EL LOCADOR" en la calle ${contract.owner_location.road} ${contract.owner_location.house_number}, ${contract.owner_location.state}. Teléfono: ${contract.owner.phone_number}. "EL LOCATARIO" en la calle ${contract.location.road} ${contract.location.house_number}, unidad ${contract.property.unit}, ${contract.location.state}. Teléfono: ${contract.tenant.phone_number}. LAS PARTES convienen que las comunicaciones y emplazamientos entre sí, con motivo del presente contrato se efectuarán por cualquier medio fehaciente. Las notificaciones cursadas de este modo se tendrán por válidas y plenamente eficaces (Art. 75, Código Civil y Comercial). Todos los cambios de domicilio deberán ser comunicados a las demás partes por telegrama, carta documento, o cualquier otro medio idóneo, dentro de las cuarenta y ocho (48) horas de producido dicho cambio, siendo válidas las comunicaciones dirigidas al anterior hasta tanto dicha notificación se produzca.`
}
