# Búsqueda de ubicación

Este es un endpoint que funciona detrás de escena y potencia la búsqueda de ubicaciones/direcciones en toda la plataforma. Cuando un usuario escribe una dirección en el formulario de creación o edición de propiedad, este endpoint busca ubicaciones que coincidan y devuelve los resultados.

Se conecta a Nominatim (un servicio de búsqueda geográfica) para encontrar direcciones, con protecciones incorporadas contra respuestas lentas y resultados demasiado grandes.
