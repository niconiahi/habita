# Computes display label for Argentine zones.
#
# Level 4 (provinces): just the name
# Level 5 (departments): "name, province"
# Levels 6-10: "name, department, province" (omitting nulls)

function compute_label(level, name, dept, prov) {
  if (level == 4) return name

  if (level == 5) {
    if (prov != "" && prov != name) return name ", " prov
    return name
  }

  if (dept != "" && prov != "") return name ", " dept ", " prov
  if (prov != "") return name ", " prov
  if (dept != "") return name ", " dept
  return name
}
