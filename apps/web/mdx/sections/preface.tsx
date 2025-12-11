import type { Props } from "~/lib/contract/pdf.server"

export function Preface({ contract }: { contract: Props }) {
  return `Entre el Sr. ${contract.owner.name} ${contract.owner.surname.toLocaleUpperCase()} con DNI ${contract.owner.document_number}, con domicilio en ${contract.owner_location.road} ${contract.owner_location.house_number}, ${contract.owner_location.state}, en adelante llamado "EL LOCADOR", por una parte, y el Sr/a. ${contract.tenant.name} ${contract.tenant.surname.toLocaleUpperCase()} con DNI ${contract.tenant.document_number}, con domicilio en ${contract.location.road} ${contract.location.house_number}, ${contract.location.state}, en adelante llamado "EL LOCATARIO", por la otra, siendo ambas partes mayores de edad y hábiles para contratar, convienen celebrar el siguiente contrato de locación que se regirá por el Código Civil y Comercial de la Nación, normativa aplicable a la materia y las siguientes clausulas y condiciones:`
}
