<script lang="ts">
  import type { Property } from "../../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
  import {
    get_service_type_label,
    type ServiceType,
  } from "$lib/service"
  import type { Service } from "db/types"
  export function concatenate_services(
    services: Array<Pick<Service, "type">>,
  ) {
    return services
      .map((service) => {
        return get_service_type_label(
          service.type as ServiceType,
        )
      })
      .join(", ")
  }
  interface Props {
    property: NonNullable<Property>
  }
  let { property }: Props = $props()
</script>

<p>
  Son a cargo exclusivo de "EL LOCADOR" el pago de todos los
  impuestos que graven el inmueble locado; sean nacionales,
  provinciales y/o municipales, con sus respectivos
  reajustes y adicionales. Son cargo exclusivo de "EL
  LOCATARIO" la totalidad de los servicios correspondientes
  tales como: {concatenate_services(property.services)},
  expensas ordinarias y cualquier servicio que en el futuro
  se creare o instalare, y que gravare al inmueble y/o a los
  servicios de los que se sirve. "EL LOCADOR" abonará las
  expensas extraordinarias.
</p>
