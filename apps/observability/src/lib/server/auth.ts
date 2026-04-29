import { redirect } from "@sveltejs/kit"
import { betterAuth } from "better-auth"
import { Pool } from "pg"

function get_config() {
  const secret = process.env.BETTER_AUTH_SECRET
  const base_url = process.env.BETTER_AUTH_URL
  const cookie_domain = process.env.COOKIE_DOMAIN
  const main_app_url = process.env.MAIN_APP_URL
  const postgres_host = process.env.POSTGRES_HOST
  const postgres_user = process.env.POSTGRES_USER
  const postgres_password = process.env.POSTGRES_PASSWORD
  const postgres_db = process.env.POSTGRES_DB
  if (!secret)
    throw new Error("BETTER_AUTH_SECRET is not set")
  if (!base_url)
    throw new Error("BETTER_AUTH_URL is not set")
  if (!cookie_domain)
    throw new Error("COOKIE_DOMAIN is not set")
  if (!main_app_url)
    throw new Error("MAIN_APP_URL is not set")
  if (!postgres_host)
    throw new Error("POSTGRES_HOST is not set")
  if (!postgres_user)
    throw new Error("POSTGRES_USER is not set")
  if (!postgres_password)
    throw new Error("POSTGRES_PASSWORD is not set")
  if (!postgres_db)
    throw new Error("POSTGRES_DB is not set")
  return {
    secret,
    base_url,
    cookie_domain,
    main_app_url,
    postgres_host,
    postgres_user,
    postgres_password,
    postgres_db,
  }
}

function make_auth() {
  const config = get_config()
  return betterAuth({
    baseURL: config.base_url,
    secret: config.secret,
    database: new Pool({
      host: config.postgres_host,
      user: config.postgres_user,
      password: config.postgres_password,
      database: config.postgres_db,
    }),
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: config.cookie_domain,
      },
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
      },
    },
  })
}

type Auth = ReturnType<typeof make_auth>
let _auth: Auth | undefined

export const auth = new Proxy({} as Auth, {
  get(_, property, receiver) {
    if (!_auth) {
      _auth = (globalThis.__auth ??= make_auth()) as Auth
    }
    return Reflect.get(_auth, property, receiver)
  },
})

interface AuthenticatedLocals {
  user: NonNullable<App.Locals["user"]>
  session: NonNullable<App.Locals["session"]>
}

export function require_authentication(
  locals: App.Locals,
  url: URL,
): asserts locals is App.Locals & AuthenticatedLocals {
  if (!locals.user || !locals.session) {
    const main_app_url = process.env.MAIN_APP_URL
    const redirect_to =
      url.origin + url.pathname + url.search
    redirect(
      302,
      `${main_app_url}/login?redirect_to=${encodeURIComponent(redirect_to)}`,
    )
  }
}
