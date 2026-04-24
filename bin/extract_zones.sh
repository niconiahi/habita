#!/usr/bin/env bash
# bin/extract_zones.sh
# Description: Extract Argentine administrative boundaries from Nominatim's
# internal PostgreSQL and output as a TSV file with precomputed
# label and badge columns.
#
# Single query extracts all admin levels 4–10, then country-specific
# awk functions (label.awk, badge.awk) compute the display columns.
#
# Output: apps/web/db/zones/argentina/data.tsv
#
# Prerequisites: The geo stack must be running (dco geo nominatim up -d)
#
# Usage:
#   bin/extract_zones.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INFRA_DIR="$REPO_ROOT/infra/development"
ENV_FILE=""
if [ -f "$INFRA_DIR/versions.env" ]; then
  ENV_FILE="--env-file $INFRA_DIR/versions.env"
fi

COUNTRY_DIR="$REPO_ROOT/apps/web/db/zones/argentina"

run_query() {
  local query="$1"
  docker compose -p geo $ENV_FILE -f "$INFRA_DIR/geo/docker-compose.yml" \
    exec -T nominatim \
    su - postgres -c "psql -d nominatim -t -A -F '	' -c \"$query\""
}

echo "extracting zones (admin levels 4–10)"
QUERY="
SELECT
  z.admin_level,
  z.name->'name' AS name,
  parent5.name->'name' AS department,
  parent4.name->'name' AS province,
  encode(ST_AsEWKB(z.geometry), 'hex') AS geometry_hex
FROM placex z
LEFT JOIN placex parent5
  ON parent5.class = 'boundary' AND parent5.type = 'administrative'
  AND parent5.admin_level = '5'
  AND ST_Contains(parent5.geometry, ST_Centroid(z.geometry))
LEFT JOIN placex parent4
  ON parent4.class = 'boundary' AND parent4.type = 'administrative'
  AND parent4.admin_level = '4'
  AND ST_Contains(parent4.geometry, ST_Centroid(z.geometry))
WHERE z.country_code = 'ar'
  AND z.class = 'boundary' AND z.type = 'administrative'
  AND z.admin_level IN ('4', '5', '6', '7', '8', '9', '10')
  AND z.name->'name' IS NOT NULL
  AND GeometryType(z.geometry) IN ('POLYGON', 'MULTIPOLYGON')
ORDER BY z.admin_level, parent4.name->'name', parent5.name->'name', z.name->'name';
"

RAW_FILE=$(mktemp)
MAIN_AWK=$(mktemp)
trap 'rm -f "$RAW_FILE" "$MAIN_AWK"' EXIT

{
  printf 'admin_level\tname\tdepartment\tprovince\tgeometry_hex\n'
  run_query "$QUERY"
} > "$RAW_FILE"

RAW_COUNT=$(($(wc -l < "$RAW_FILE") - 1))
echo "raw extraction complete ($RAW_COUNT rows). computing label and badge"

cat > "$MAIN_AWK" << 'AWKEOF'
BEGIN {
  OFS = "\t"
  _b5["Buenos Aires"] = "Partido"
  _b5["Ciudad Autónoma de Buenos Aires"] = "Comuna"
  _b6["Buenos Aires"] = "Cuartel"
  _b6["Córdoba"] = "Pedanía"
  _b6["Entre Ríos"] = "Distrito"
  _b6["Mendoza"] = "Distrito"
  _b6["San Juan"] = "Distrito"
}
NR == 1 { print "name", "admin_level", "label", "badge", "geometry_hex"; next }
{ print $2, $1, compute_label($1, $2, $3, $4), compute_badge($1, $4), $5 }
AWKEOF

awk -F'\t' \
  -f "$COUNTRY_DIR/label.awk" \
  -f "$COUNTRY_DIR/badge.awk" \
  -f "$MAIN_AWK" \
  "$RAW_FILE" > "$COUNTRY_DIR/data.tsv"

FINAL_COUNT=$(($(wc -l < "$COUNTRY_DIR/data.tsv") - 1))
echo "saved $FINAL_COUNT zones to db/zones/argentina/data.tsv"
echo "done"
