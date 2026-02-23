import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { Pool } from "pg"
import { encrypt } from "./encryption"
import { lazy } from "$lib/server/lazy"

function get_config() {
  const secret = process.env.BETTER_AUTH_SECRET
  const base_url = process.env.BETTER_AUTH_URL
  const postgres_host = process.env.POSTGRES_HOST
  const postgres_user = process.env.POSTGRES_USER
  const postgres_password = process.env.POSTGRES_PASSWORD
  const postgres_db = process.env.POSTGRES_DB
  const google_client_id = process.env.GOOGLE_CLIENT_ID
  const google_client_secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set")
  if (!base_url) throw new Error("BETTER_AUTH_URL is not set")
  if (!postgres_host) throw new Error("POSTGRES_HOST is not set")
  if (!postgres_user) throw new Error("POSTGRES_USER is not set")
  if (!postgres_password) throw new Error("POSTGRES_PASSWORD is not set")
  if (!postgres_db) throw new Error("POSTGRES_DB is not set")
  if (!google_client_id) throw new Error("GOOGLE_CLIENT_ID is not set")
  if (!google_client_secret) throw new Error("GOOGLE_CLIENT_SECRET is not set")
  return { secret, base_url, postgres_host, postgres_user, postgres_password, postgres_db, google_client_id, google_client_secret }
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

export const auth = lazy(() => {
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
        surname: { type: "string", required: true },
        phone_number: { type: "string", required: false },
        document_number: { type: "string", required: false },
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
            try {
              await auth.api.createOrganization({
                body: {
                  name: `Personal: ${user.email}`,
                  slug: `personal-${user.id}`,
                  userId: String(user.id),
                },
              })
            } catch (error) {
              console.error(
                "Failed to create organization for user:",
                user.id,
                error,
              )
              throw error
            }
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
        organizationHooks: {
          afterCreateOrganization: async ({
            organization,
          }) => {
            await auth.api.createTeam({
              body: {
                name: "Principal",
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
})
