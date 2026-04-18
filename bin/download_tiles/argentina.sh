#!/usr/bin/env bash
# bin/download_tiles/argentina.sh
# Description: Generate Argentina mbtiles from Geofabrik OSM extract using Planetiler.
#              Idempotent — skips if the output file already exists.
#
# Output: infra/{ENV}/geo/tiles/argentina.mbtiles
#
# Prerequisites: Docker must be running.
#
# Usage:
#   bin/download_tiles/argentina.sh                    # defaults to development
#   ENV=production bin/download_tiles/argentina.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ENV="${ENV:-development}"
TILES_DIR="$REPO_ROOT/infra/$ENV/geo/tiles"
OUTPUT="$TILES_DIR/argentina.mbtiles"

if [ -f "$OUTPUT" ]; then
  echo "argentina.mbtiles already exists at $OUTPUT — skipping"
  exit 0
fi

mkdir -p "$TILES_DIR"

echo "Generating argentina.mbtiles with Planetiler..."
echo "This downloads ~700MB from Geofabrik and takes a few minutes."

docker run --rm \
  -e JAVA_TOOL_OPTIONS="-Xmx4g" \
  -v "$TILES_DIR":/data \
  ghcr.io/onthegomap/planetiler:latest \
  --download --area=argentina \
  --mbtiles=/data/argentina.mbtiles \
  --force

echo "Done: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
