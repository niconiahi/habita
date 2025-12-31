<script lang="ts">
  import type { Property } from "../../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
  interface Props {
    property: NonNullable<Property>
  }
  let { property }: Props = $props()
</script>

<p>
  <strong>"EL LOCADOR"</strong> da la locación a <strong>"EL LOCATARIO"</strong> y este acepta
  de conformidad, un inmueble de su propiedad, ubicado en la
  calle <strong>{property.location.road}</strong>
  <strong>{property.location.house_number}</strong>, unidad <strong>{property.unit}</strong>,
  dentro de <strong>{property.location.state}</strong>, Argentina, con la
  posibilidad de utilizar una cochera cubierta ubicada en
  dicho domicilio.
</p>
