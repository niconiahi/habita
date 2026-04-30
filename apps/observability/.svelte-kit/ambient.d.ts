
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const DOCKER_BUILDKIT: string;
	export const COMPOSE_FILE: string;
	export const npm_config_user_agent: string;
	export const BETTER_AUTH_SECRET: string;
	export const NODE_VERSION: string;
	export const HOSTNAME: string;
	export const RUSTFS_ACCESS_KEY: string;
	export const MERCADO_PAGO_TEST_ACCESS_TOKEN: string;
	export const YARN_VERSION: string;
	export const npm_node_execpath: string;
	export const DIGITAL_SIGNATURE_USERNAME: string;
	export const SMTP_PORT: string;
	export const OTEL_SERVICE_NAME: string;
	export const OBJECT_STORE_BUCKET: string;
	export const PORT: string;
	export const HOME: string;
	export const npm_package_json: string;
	export const COREPACK_ROOT: string;
	export const OPENAI_API_KEY: string;
	export const BUILDX_NO_DEFAULT_ATTESTATIONS: string;
	export const OBJECT_STORE_ACCESS_KEY: string;
	export const CLICKHOUSE_URL: string;
	export const CLOUDFLARE_ACCOUNT_ID: string;
	export const OBJECT_STORE_ENDPOINT: string;
	export const COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const DIGITAL_SIGNATURE_SALT: string;
	export const npm_config_registry: string;
	export const DIGITAL_SIGNATURE_BASE_URL: string;
	export const MERCADO_PAGO_ACCESS_TOKEN: string;
	export const GOOGLE_CLIENT_ID: string;
	export const GOOGLE_CLIENT_SECRET: string;
	export const POSTGRES_PASSWORD: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const MERCADO_PAGO_CLIENT_ID: string;
	export const npm_package_name: string;
	export const NODE: string;
	export const MERCADO_PAGO_CLIENT_SECRET: string;
	export const npm_config_frozen_lockfile: string;
	export const POSTGRES_HOST: string;
	export const OTEL_ENVIRONMENT: string;
	export const POSTGRES_USER: string;
	export const DIGITAL_SIGNATURE_IV: string;
	export const MERCADO_PAGO_WEBHOOK_SECRET: string;
	export const DIGITAL_SIGNATURE_PASSWORD: string;
	export const RUSTFS_SECRET_KEY: string;
	export const OTEL_EXPORTER_OTLP_ENDPOINT: string;
	export const npm_lifecycle_script: string;
	export const BETTER_AUTH_URL: string;
	export const IMGPROXY_SALT: string;
	export const ENCRYPTION_KEY: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const npm_config_verify_deps_before_run: string;
	export const NODE_PATH: string;
	export const R2_BACKUP_ACCESS_KEY_ID: string;
	export const AWS_ACCESS_KEY_ID: string;
	export const R2_BACKUP_SECRET_ACCESS_KEY: string;
	export const OBS_POSTGRES_DB: string;
	export const R2_BACKUP_ENDPOINT: string;
	export const AWS_SECRET_ACCESS_KEY: string;
	export const IMGPROXY_KEY: string;
	export const npm_config_npm_globalconfig: string;
	export const OBJECT_STORE_SECRET_KEY: string;
	export const SMTP_PASS: string;
	export const IMGPROXY_SOURCE_SECRET: string;
	export const DIGITAL_SIGNATURE_PRIVATE_KEY: string;
	export const DIGITAL_SIGNATURE_USER_ID: string;
	export const npm_config_globalconfig: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const GOOGLE_REDIRECT_URL: string;
	export const POSTGRES_DB: string;
	export const npm_config__jsr_registry: string;
	export const npm_command: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const REDIS_URL: string;
	export const SMTP_HOST: string;
	export const SMTP_USER: string;
	export const INIT_CWD: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		DOCKER_BUILDKIT: string;
		COMPOSE_FILE: string;
		npm_config_user_agent: string;
		BETTER_AUTH_SECRET: string;
		NODE_VERSION: string;
		HOSTNAME: string;
		RUSTFS_ACCESS_KEY: string;
		MERCADO_PAGO_TEST_ACCESS_TOKEN: string;
		YARN_VERSION: string;
		npm_node_execpath: string;
		DIGITAL_SIGNATURE_USERNAME: string;
		SMTP_PORT: string;
		OTEL_SERVICE_NAME: string;
		OBJECT_STORE_BUCKET: string;
		PORT: string;
		HOME: string;
		npm_package_json: string;
		COREPACK_ROOT: string;
		OPENAI_API_KEY: string;
		BUILDX_NO_DEFAULT_ATTESTATIONS: string;
		OBJECT_STORE_ACCESS_KEY: string;
		CLICKHOUSE_URL: string;
		CLOUDFLARE_ACCOUNT_ID: string;
		OBJECT_STORE_ENDPOINT: string;
		COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
		pnpm_config_verify_deps_before_run: string;
		DIGITAL_SIGNATURE_SALT: string;
		npm_config_registry: string;
		DIGITAL_SIGNATURE_BASE_URL: string;
		MERCADO_PAGO_ACCESS_TOKEN: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		POSTGRES_PASSWORD: string;
		npm_config_node_gyp: string;
		PATH: string;
		MERCADO_PAGO_CLIENT_ID: string;
		npm_package_name: string;
		NODE: string;
		MERCADO_PAGO_CLIENT_SECRET: string;
		npm_config_frozen_lockfile: string;
		POSTGRES_HOST: string;
		OTEL_ENVIRONMENT: string;
		POSTGRES_USER: string;
		DIGITAL_SIGNATURE_IV: string;
		MERCADO_PAGO_WEBHOOK_SECRET: string;
		DIGITAL_SIGNATURE_PASSWORD: string;
		RUSTFS_SECRET_KEY: string;
		OTEL_EXPORTER_OTLP_ENDPOINT: string;
		npm_lifecycle_script: string;
		BETTER_AUTH_URL: string;
		IMGPROXY_SALT: string;
		ENCRYPTION_KEY: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		npm_config_verify_deps_before_run: string;
		NODE_PATH: string;
		R2_BACKUP_ACCESS_KEY_ID: string;
		AWS_ACCESS_KEY_ID: string;
		R2_BACKUP_SECRET_ACCESS_KEY: string;
		OBS_POSTGRES_DB: string;
		R2_BACKUP_ENDPOINT: string;
		AWS_SECRET_ACCESS_KEY: string;
		IMGPROXY_KEY: string;
		npm_config_npm_globalconfig: string;
		OBJECT_STORE_SECRET_KEY: string;
		SMTP_PASS: string;
		IMGPROXY_SOURCE_SECRET: string;
		DIGITAL_SIGNATURE_PRIVATE_KEY: string;
		DIGITAL_SIGNATURE_USER_ID: string;
		npm_config_globalconfig: string;
		PWD: string;
		npm_execpath: string;
		GOOGLE_REDIRECT_URL: string;
		POSTGRES_DB: string;
		npm_config__jsr_registry: string;
		npm_command: string;
		PNPM_SCRIPT_SRC_DIR: string;
		REDIS_URL: string;
		SMTP_HOST: string;
		SMTP_USER: string;
		INIT_CWD: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
