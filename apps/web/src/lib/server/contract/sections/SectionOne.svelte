<script lang="ts">
  import type { Property } from "../../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
  interface Props {
    property: NonNullable<Property>
  }
  let { property }: Props = $props()
</script>

<p>
  "EL LOCADOR" da la locación a "EL LOCATARIO" y este acepta
  de conformidad, un inmueble de su propiedad, ubicado en la
  calle {property.location.road}
  {property.location.house_number}, unidad {property.unit},
  dentro de {property.location.state}, Argentina, con la
  posibilidad de utilizar una cochera cubierta ubicada en
  dicho domicilio.
</p>
