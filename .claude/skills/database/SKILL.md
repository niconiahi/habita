---
name: database
description: Database migration commands. Use when creating new migrations, modifying database schemas, or working with Kysely migrations.
---

- To create a new migration, you must use `kysely-ctl migrate:make some_migration_file_name`
- To run a migration, you must use the command `dco app svelte run pnpm run db:migrate`
- After a migration, you must refresh the types `dco app svelte run pnpm run db:types`
