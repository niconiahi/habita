import { redirect } from "@sveltejs/kit"
import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { query_builder } from "db/query_builder"
import { Pool } from "pg"
import { logger } from "$lib/telemetry/logger"
import { publish_send_team_invite } from "./broker/producer/publish_send_team_invite"
import { decrypt, encrypt } from "./encryption"
import { send_email } from "./send_email"

function get_config() {
  const secret = process.env.BETTER_AUTH_SECRET
  const base_url = process.env.BETTER_AUTH_URL
  const postgres_host = process.env.POSTGRES_HOST
  const postgres_user = process.env.POSTGRES_USER
  const postgres_password = process.env.POSTGRES_PASSWORD
  const postgres_db = process.env.POSTGRES_DB
  const google_client_id = process.env.GOOGLE_CLIENT_ID
  const google_client_secret =
    process.env.GOOGLE_CLIENT_SECRET
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
    throw new Error("POSTGRES_DB is not set")
  if (!google_client_id)
    throw new Error("GOOGLE_CLIENT_ID is not set")
  if (!google_client_secret)
    throw new Error("GOOGLE_CLIENT_SECRET is not set")
  return {
    secret,
    base_url,
    postgres_host,
    postgres_user,
    postgres_password,
    postgres_db,
    google_client_id,
    google_client_secret,
  }
}

const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  member_invitation: ["create", "cancel"],
  owner_invitation: ["create", "cancel"],
  property_assignment: ["create", "update"],
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
} as const

const ac = createAccessControl(statement)

const landlord = ac.newRole({
  property: ["read"],
  contract: ["read"],
  tenant: ["read"],
})

const realtor = ac.newRole({
  organization: ["update", "delete"],
  member_invitation: ["create", "cancel"],
  member: ["create", "update", "delete"],
  property_assignment: ["create", "update"],
  property: ["read"],
})

const manager = ac.newRole({
  organization: ["update"],
  property: ["read", "write"],
  contract: ["read", "write"],
  owner_invitation: ["create", "cancel"],
  tenant: ["read"],
})

const tenant = ac.newRole({
  tenant: ["read", "write"],
  property: ["read"],
  contract: ["read"],
})

function make_auth() {
  const config = get_config()
  return betterAuth({
    baseURL: config.base_url,
    secret: config.secret,
    trustedOrigins: [
      "https://dev.habita.rent",
      "https://habita.rent",
      "https://svelte:5174",
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        // NOTE: log verification URL to stdout so we can verify emails locally via `just logs svelte`
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[verification] ${user.email}: ${url}`,
          )
          return
        }
        send_email({
          to: { email: user.email, name: user.name },
          subject: "Verificá tu email",
          html: `<p>Hacé clic en el enlace para verificar tu email: <a href="${url}">${url}</a></p>`,
        }).catch(() => {})
      },
    },
    database: new Pool({
      host: config.postgres_host,
      user: config.postgres_user,
      password: config.postgres_password,
      database: config.postgres_db,
    }),
    advanced: {
      database: {
        generateId: ({ model }) => {
          if (model === "user") {
            return false
          }
          return crypto.randomUUID()
        },
      },
      crossSubDomainCookies: {
        enabled: true,
        domain: process.env.COOKIE_DOMAIN,
      },
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
      additionalFields: {
        surname: { type: "string", required: false },
        phone_number: { type: "string", required: false },
        document_number: {
          type: "string",
          required: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24 * 15,
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
    socialProviders: {
      google: {
        clientId: config.google_client_id,
        clientSecret: config.google_client_secret,
        prompt: "select_account",
        mapProfileToUser: (profile) => ({
          name: profile.given_name,
          surname: profile.family_name,
          image:
            profile.picture || "/images/default-avatar.svg",
        }),
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            return {
              data: {
                ...user,
                image:
                  user.image && user.image.length > 0
                    ? user.image
                    : "/images/default-avatar.svg",
                name:
                  typeof user.name === "string"
                    ? encrypt(user.name)
                    : user.name,
                surname:
                  typeof user.surname === "string"
                    ? encrypt(user.surname)
                    : user.surname,
              },
            }
          },
          after: async (user) => {
            logger.info("user signed up", {
              user_id: user.id,
              email: user.email,
            })
          },
        },
      },
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: false,
        creatorRole: "manager",
        ac,
        roles: {
          landlord,
          realtor,
          manager,
          tenant,
        },
        teams: {
          enabled: true,
          allowRemovingAllTeams: false,
        },
        sendInvitationEmail: async (data) => {
          const config = get_config()
          const team_name = data.invitation.teamId
            ? (
                await query_builder
                  .selectFrom("team")
                  .where("id", "=", data.invitation.teamId)
                  .select("name")
                  .executeTakeFirst()
              )?.name
            : null
          const display_team_name =
            team_name ?? data.organization.name
          const inviter_name = data.inviter.user.name
            ? decrypt(data.inviter.user.name)
            : data.inviter.user.email
          const subject = `Te invitaron al equipo ${display_team_name}`
          const link = `${config.base_url}/invitations/${data.id}/accept`
          const html = `
<p>${inviter_name} te invitó al equipo <strong>${display_team_name}</strong> en ${data.organization.name}.</p>
<p><a href="${link}">Aceptar invitación</a></p>
<p>El link expira en 48 horas.</p>`
          if (process.env.NODE_ENV === "development") {
            console.log(`[team_invite] ${data.email}: ${link}`)
          }
          await publish_send_team_invite(data.id, {
            email: data.email,
            subject,
            html,
          })
        },
        organizationHooks: {
          afterCreateOrganization: async ({
            organization,
          }) => {
            await auth.api.createTeam({
              body: {
                name: "Ejemplo",
                organizationId: organization.id,
              },
            })
          },
        },
        schema: {
          organization: {
            fields: {
              createdAt: "created_at",
              updatedAt: "updated_at",
            },
          },
          member: {
            fields: {
              userId: "user_id",
              organizationId: "organization_id",
              createdAt: "created_at",
              updatedAt: "updated_at",
            },
          },
          invitation: {
            fields: {
              organizationId: "organization_id",
              inviterId: "inviter_id",
              expiresAt: "expires_at",
              teamId: "team_id",
              createdAt: "created_at",
              updatedAt: "updated_at",
            },
          },
          team: {
            fields: {
              organizationId: "organization_id",
              createdAt: "created_at",
              updatedAt: "updated_at",
            },
          },
          teamMember: {
            modelName: "team_member",
            fields: {
              teamId: "team_id",
              userId: "user_id",
              createdAt: "created_at",
            },
          },
        },
      }),
    ],
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
  url?: URL,
): asserts locals is App.Locals & AuthenticatedLocals {
  if (!locals.user || !locals.session) {
    if (url) {
      const redirect_to = url.pathname + url.search
      redirect(
        302,
        `/login?redirect_to=${encodeURIComponent(redirect_to)}`,
      )
    }
    redirect(302, "/login")
  }
}
