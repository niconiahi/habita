# Config file management

Config files live in `config/` directories, symlinked back to root where tools expect them.

## Locations

- **Monorepo root:** `config/` contains Justfile, `*.just`, `.mcp.json`, `.sops.yaml`, `.tool-versions`
- **apps/web:** `apps/web/config/` contains `package.json`, `tsconfig.json`, `vite.config.ts`, `svelte.config.js`, `biome.json`, `playwright.config.ts`, `kysely.config.ts`, `Dockerfile`, `.dockerignore`, `.mcp.json`, `.npmrc`, `.prettierrc`, `.prettierignore`, `pnpm-lock.yaml`

## Exceptions

`.gitignore` files stay at root (NOT in `config/`). Git cannot follow symlinked `.gitignore` files.

## Adding a new config file

1. Create the file inside `config/`
2. Run `just link`

## Editing a config file

Edit either the real file in `config/` or the symlink at root — both work identically.

## How it works

`just link` runs `bin/symlink-configs.sh`, which iterates files in each `config/` directory and creates relative symlinks (`config/<file>` -> `../<file>`) one level up. It's idempotent — existing symlinks are skipped.
