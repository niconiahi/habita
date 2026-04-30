import { redirect } from "@sveltejs/kit"
import { betterAuth } from "better-auth"
import { Pool } from "pg"

function get_config() {
  const secret = process.env.BETTER_AUTH_SECRET
  const base_url = process.env.BETTER_AUTH_URL
  const postgres_host = process.env.POSTGRES_HOST
  const postgres_user = process.env.POSTGRES_USER
  const postgres_password = process.env.POSTGRES_PASSWORD
  const postgres_db = process.env.OBS_POSTGRES_DB
  if (!secret)
    throw new Error("BETTER_AUTH_SECRET is not set")
  if (!base_url)
    throw new Error("BETTER_AUTH_URL is not set")
  if (!postgres_host)
    throw new Error("POSTGRES_HOST is not set")
  if (!postgres_user)
    throw new Error("POSTGRES_USER is not set")
  if (!postgres_password)
    throw new Error("POSTGRES_PASSWORD is not set")
  if (!postgres_db)
    throw new Error("OBS_POSTGRES_DB is not set")
  return {
    secret,
    base_url,
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
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
      },
    },
    user: {
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    session: {
      fields: {
        userId: "user_id",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    account: {
      fields: {
        userId: "user_id",
        accountId: "account_id",
        providerId: "provider_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        idToken: "id_token",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
  })
}

type Auth = ReturnType<typeof make_auth>
let _auth: Auth | undefined

export const auth = new Proxy({} as Auth, {
  get(_, property, receiver) {
    if (!_auth) {
      _auth = (globalThis.__obs_auth ??=
        make_auth()) as Auth
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
): asserts locals is App.Locals & AuthenticatedLocals {
  if (!locals.user || !locals.session) {
    redirect(302, "/login")
  }
}
