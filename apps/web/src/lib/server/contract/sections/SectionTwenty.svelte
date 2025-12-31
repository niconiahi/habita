<script lang="ts">
  import type { Property } from "../../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
  import type { Owner } from "../../owner"
  import type { Tenant } from "../../tenant"
  interface Props {
    tenant: NonNullable<Tenant>
    owner: NonNullable<Owner>
  }
  let { owner, tenant }: Props = $props()
</script>

<p>
  Las partes establecen los siguientes domicilios para todo
  lo relativo al presente contrato: <strong>"EL LOCADOR"</strong> con
  domicilio electrónico <strong>{owner.email}</strong>. Teléfono: <strong>{owner.phone_number}</strong>.
  <strong>"EL LOCATARIO"</strong> con domicilio electrónico <strong>{tenant.email}</strong>.
  Teléfono: <strong>{tenant.phone_number}</strong>. LAS PARTES convienen que
  las comunicaciones y emplazamientos entre sí, con motivo
  del presente contrato se efectuarán por cualquier medio
  fehaciente. Las notificaciones cursadas de este modo se
  tendrán por válidas y plenamente eficaces (Art. 75, Código
  Civil y Comercial). Todos los cambios de domicilio deberán
  ser comunicados a las demás partes por telegrama, carta
  documento, o cualquier otro medio idóneo, dentro de las
  cuarenta y ocho (48) horas de producido dicho cambio,
  siendo válidas las comunicaciones dirigidas al anterior
  hasta tanto dicha notificación se produzca.
</p>
