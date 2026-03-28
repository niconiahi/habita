#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

link_configs() {
  local config_dir="$1"
  local target_dir="$(dirname "$config_dir")"

  for file in "$config_dir"/* "$config_dir"/.*; do
    local name="$(basename "$file")"
    [ "$name" = "." ] || [ "$name" = ".." ] && continue
    [ -e "$file" ] || continue
    local link="$target_dir/$name"

    if [ -L "$link" ]; then
      echo "skip: $link (symlink exists)"
    else
      ln -s "config/$name" "$link"
      echo "link: $link -> config/$name"
    fi
  done
}

echo "=== Monorepo root ==="
link_configs "$REPO_ROOT/config"

echo ""
echo "=== apps/web ==="
link_configs "$REPO_ROOT/apps/web/config"
