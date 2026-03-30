---
name: database
description: Database migration commands. Use when creating new migrations, modifying database schemas, or working with Kysely migrations.
---

- To create a new migration: `just db make some_migration_file_name`
- To run pending migrations: `just db migrate`
- To refresh types after a migration: `just db types`
- To run seeds: `just db seed`
- To reset the database (drop, recreate, migrate, seed): `just db reset`

## Seed data rules

- Location seed data (addresses, coordinates) must be verified against the local Nominatim instance before committing. Never use made-up coordinates or addresses — query Nominatim to get real Argentine location data.
