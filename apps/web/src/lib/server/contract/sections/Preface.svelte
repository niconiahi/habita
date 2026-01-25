<script lang="ts">
  import type { Landlord } from "../../landlord"
  import type { Tenant } from "../../tenant"
  interface Props {
    tenant: NonNullable<Tenant>
    landlord: NonNullable<Landlord>
  }
  let { landlord, tenant }: Props = $props()
</script>

<p>
  Entre el Sr/a. <strong>{landlord.name}</strong>
  <strong>{landlord.surname.toLocaleUpperCase()}</strong> con
  DNI <strong>{landlord.document_number}</strong>, con
  domicilio electrónico <strong>{landlord.email}</strong>, en
  adelante llamado <strong>"EL LOCADOR"</strong>, por una
  parte, y el Sr/a. <strong>{tenant.name}</strong>
  <strong>{tenant.surname.toLocaleUpperCase()}</strong> con
  DNI <strong>{tenant.document_number}</strong>, con
  domicilio electrónico <strong>{tenant.email}</strong>, en
  adelante llamado <strong>"EL LOCATARIO"</strong>, por la
  otra, siendo ambas partes mayores de edad y hábiles para
  contratar, convienen celebrar el siguiente contrato de
  locación que se regirá por el Código Civil y Comercial de
  la Nación, normativa aplicable a la materia y las
  siguientes clausulas y condiciones:
</p>
