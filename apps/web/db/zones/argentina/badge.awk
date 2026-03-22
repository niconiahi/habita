# Computes badge for Argentine zones.
# Mapping sourced from apps/web/temp/province_levels.md

function compute_badge(level, prov) {
  if (level == 4) return "Provincia"
  if (level == 5) return (prov in _b5) ? _b5[prov] : "Departamento"
  if (level == 6) return (prov in _b6) ? _b6[prov] : "Zona"
  if (level == 7) return "Municipio"
  if (level == 8) return "Localidad"
  if (level == 9) return "Barrio"
  return "Zona"
}
