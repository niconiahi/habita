import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  ownerAc,
  adminAc,
} from "better-auth/plugins/organization/access"
import { Pool } from "pg"
import { encrypt } from "./encryption"

const statement = {
  ...defaultStatements,
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
} as const

const ac = createAccessControl(statement)

const landlord = ac.newRole({
  ...ownerAc.statements,
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
})

const realtor = ac.newRole({
  ...adminAc.statements,
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
})

const manager = ac.newRole({
  ...adminAc.statements,
  property: ["read", "write"],
  contract: ["read", "write"],
  tenant: ["read", "write"],
})

const tenant = ac.newRole({
  property: ["read"],
  contract: ["read"],
})

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["dev.habita.rent", "habita.rent"],
  database: new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  }),
  advanced: {
    generateId: false,
    defaultCookieAttributes: {
      sameSite: "none",
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
      mapProfileToUser: (profile) => ({
        name: encrypt(profile.given_name),
        surname: encrypt(profile.family_name),
      }),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await auth.api.createOrganization({
            body: {
              name: `Personal: ${user.email}`,
              slug: `personal-${user.id}`,
              userId: String(user.id),
            },
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
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          await auth.api.createTeam({
            body: { name: "Principal", organizationId: organization.id },
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
