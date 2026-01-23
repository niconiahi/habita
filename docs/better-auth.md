### Initiate Google Social Sign-In with Better Auth Client (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/google.mdx

This client-side code snippet demonstrates how to initiate a social sign-in flow specifically for Google using the `better-auth/client` library. It calls the `signIn.social` function, specifying "google" as the provider.

```typescript
import { createAuthClient } from "better-auth/client";
const authClient = createAuthClient();

const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  });
};
```

--------------------------------

### Sign In with Google using ID Token via Better Auth Client (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/google.mdx

This snippet shows how to sign in with Google by directly providing an ID token and access token received from Google on the client side. This method bypasses the redirection flow, enabling direct user sign-in without a full OAuth redirect.

```typescript
const data = await authClient.signIn.social({
    provider: "google",
    idToken: {
        token: // Google ID Token,
        accessToken: // Google Access Token
    }
})
```

--------------------------------

### Configure Google Social Provider in Better Auth (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

This code snippet demonstrates how to configure Google as a social authentication provider within the Better Auth framework. It requires providing the `clientId` and `clientSecret` obtained from your Google API project. This setup enables users to authenticate via Google.

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
    },
  },
});
```

--------------------------------

### Configure Google Social Provider in Better Auth (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/google.mdx

This code configures the Google social provider within the `betterAuth` instance. It requires `clientId` and `clientSecret` from Google Cloud Console, typically sourced from environment variables, and highlights the importance of setting a `baseURL` to ensure correct OAuth callback URLs.

```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL, // [!code highlight]
    socialProviders: {
        google: { // [!code highlight]
            clientId: process.env.GOOGLE_CLIENT_ID as string, // [!code highlight]
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, // [!code highlight]
        }, // [!code highlight]
    },
})
```

--------------------------------

### Configure Google Provider to Always Ask for Account Selection (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/google.mdx

This configuration snippet modifies the Google social provider settings to include the `prompt: "select_account"` parameter. This ensures that Google always prompts the user to select an account, even if they have previously granted access or have a default account, providing more explicit control over the sign-in flow.

```typescript
socialProviders: {
    google: {
        prompt: "select_account", // [!code highlight]
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
}
```

--------------------------------

### Request Additional Google Scopes using linkSocial

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/google.mdx

Demonstrates how to request additional Google scopes (e.g., Google Drive, Gmail) after a user has already signed up using the linkSocial method. Triggers a new OAuth flow that adds new scopes to the user's account and updates the access token. Requires Better Auth version 1.2.7 or later to avoid 'Social account already linked' errors.

```typescript
const requestGoogleDriveAccess = async () => {
  await authClient.linkSocial({
    provider: "google",
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
};

// Example usage in a React component
return (
  <button onClick={requestGoogleDriveAccess}>
    Add Google Drive Permissions
  </button>
);
```

--------------------------------

### Configure Google OAuth to Always Get Refresh Token

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/google.mdx

Shows how to configure Google OAuth provider settings to always obtain a refresh token by setting accessType to 'offline' and prompt to 'select_account consent'. This ensures refresh tokens are issued on subsequent OAuth flows, not just the first authorization. Required because Google only issues refresh tokens on first user consent by default.

```typescript
socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        accessType: "offline",
        prompt: "select_account consent",
    },
}
```

--------------------------------

### Configuration: Google Provider `disableDefaultScope`

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Configure Google social provider settings, including disabling default scopes and specifying custom ones for OAuth.

```APIDOC
## Configuration: `disableDefaultScope` for Google Provider

### Description
This configuration option, `disableDefaultScope`, is used within the `google` social provider settings of the `betterAuth` library. When set to `true`, it removes the default scopes (like `email` and `profile`) that providers typically include, allowing you to use only the scopes explicitly defined in the `scope` array.

### Location
`betterAuth({ socialProviders: { google: { disableDefaultScope: boolean } } })`

### Parameters
- **disableDefaultScope** (boolean) - Required - Set to `true` to remove default scopes and use only specified `scope` values. Default is `false` (default scopes are included).
- **scope** (array<string>) - Optional - An array of strings defining the specific OAuth scopes to request from the provider. Only applicable if `disableDefaultScope` is `true`.

### Example Configuration (TypeScript)
```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableDefaultScope: true, // Remove default 'email' and 'profile' scopes
      scope: ["https://www.googleapis.com/auth/userinfo.email"], // Request only user email
    },
  },
});
```
```

--------------------------------

### Configure Google Provider with Custom Scopes

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Sets up Google OAuth provider with disableDefaultScope enabled to override default scopes and use only custom-specified scopes. The disableDefaultScope option removes default scopes like 'email' and 'profile', allowing fine-grained control over requested permissions. This configuration requires Google client credentials and custom scope URLs.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableDefaultScope: true,
      scope: ["https://www.googleapis.com/auth/userinfo.email"], // Only this scope will be used
    },
  },
});
```

--------------------------------

### Configure Social Providers

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Set up OAuth providers like Google by providing clientId and clientSecret credentials. This configuration enables users to authenticate through third-party OAuth providers.

```APIDOC
## Configure Social Providers

### Description
Configure OAuth 2.0 social providers with credentials to enable third-party authentication

### Configuration
```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET"
    }
  }
});
```

### Required Fields
- **clientId** (string) - Required - OAuth application client ID from the provider
- **clientSecret** (string) - Required - OAuth application client secret from the provider

### Supported Providers
- Google
- Facebook
- GitHub
- Additional providers via Generic OAuth Plugin
```

--------------------------------

### Map Profile to User with Google OAuth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Configure mapProfileToUser function to transform provider profile data into your application's user object. Useful for populating additional user fields or customizing the default profile mapping behavior during social sign-in.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
});
```

--------------------------------

### Configure Environment Variables for Better Auth Astro Project

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/examples/astro.mdx

This snippet outlines the essential environment variables required for configuring a Better Auth Astro project. It includes placeholders for Google client credentials and the Better Auth secret, which are critical for enabling social sign-in and securing authentication. These variables should be provided in a `.env` file.

```txt
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BETTER_AUTH_SECRET=
```

--------------------------------

### Configure Stateless Auth with Social Providers

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/blogs/1-4.mdx

Initialize Better Auth with stateless session management by omitting the database option. Supports Google OAuth without requiring a database backend, ideal for serverless environments.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    // No database configuration
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
});
```

--------------------------------

### Map Social Provider Profile Data to Custom User Fields (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/database.mdx

This code snippet shows how to integrate custom user fields with social/OAuth providers by using the 'mapProfileToUser' function. It demonstrates extracting and mapping profile data (e.g., 'name', 'given_name', 'family_name') from GitHub and Google profiles to custom 'firstName' and 'lastName' fields in the Better Auth user object.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: "YOUR_GITHUB_CLIENT_ID",
      clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.name.split(" ")[0],
          lastName: profile.name.split(" ")[1],
        };
      },
    },
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
});
```

--------------------------------

### Display One Tap Popup

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/one-tap.mdx

Call the oneTap method on the auth client to display the Google One Tap popup to the user. This is the basic method to initiate the One Tap login flow.

```typescript
await authClient.oneTap();
```

--------------------------------

### Refresh Access Token with Google OAuth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Implement custom token refresh logic using the refreshAccessToken function. Supported for built-in social providers (Google, Facebook, GitHub, etc.) but not for custom OAuth providers. Returns new access and refresh tokens.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      refreshAccessToken: async (token) => {
        return {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        };
      },
    },
  },
});
```

--------------------------------

### Configure Social Providers in Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/guides/auth0-migration-guide.mdx

Integrate external social login providers like Google and GitHub into your Better Auth configuration. This snippet demonstrates how to define client IDs and secrets using environment variables for secure OAuth integration.

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: { // [!code highlight]
        google: { // [!code highlight]
            clientId: process.env.GOOGLE_CLIENT_ID, // [!code highlight]
            clientSecret: process.env.GOOGLE_CLIENT_SECRET, // [!code highlight]
        }, // [!code highlight]
        github: { // [!code highlight]
            clientId: process.env.GITHUB_CLIENT_ID, // [!code highlight]
            clientSecret: process.env.GITHUB_CLIENT_SECRET, // [!code highlight]
        } // [!code highlight]
    } // [!code highlight]
})
```

--------------------------------

### Install Optional Social Provider Dependencies for Expo (Shell)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/expo.mdx

This command installs optional Expo dependencies ('expo-linking', 'expo-web-browser', 'expo-constants') needed if your application plans to use social authentication providers like Google or Apple. These are typically required when not using the default Expo template.

```sh
expo-linking expo-web-browser expo-constants
```

--------------------------------

### Configure Social Providers Authentication in Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/reference/options.mdx

Set up social login providers (Google, GitHub, etc.) with OAuth credentials and redirect URIs. Supports multiple providers with customizable scopes, profile mapping, sign-up control, token refresh, and ID token verification.

```typescript
import { betterAuth } from "better-auth";
export const auth = betterAuth({
	socialProviders: {
		google: {
			clientId: "your-client-id",
			clientSecret: "your-client-secret",
			redirectURI: "https://example.com/api/auth/callback/google"
		},
		github: {
			clientId: "your-client-id",
			clientSecret: "your-client-secret",
			redirectURI: "https://example.com/api/auth/callback/github"
		}
	},
})
```

--------------------------------

### Initialize One Tap Client Plugin with Configuration

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/one-tap.mdx

Create an auth client with the One Tap client plugin, specifying the Google Client ID and optional configuration for behavior customization, including autoSelect, cancelOnTapOutside, context, and promptOptions for retry logic.

```typescript
import { createAuthClient } from "better-auth/client";
import { oneTapClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    oneTapClient({
      clientId: "YOUR_CLIENT_ID",
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
      additionalOptions: {},
      promptOptions: {
        baseDelay: 1000,
        maxAttempts: 5
      }
    })
  ]
});
```

--------------------------------

### Sign In User with Social Provider in Better Auth (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

This snippet shows how to initiate a social sign-in process using Better Auth. It includes both client-side usage with `authClient.signIn.social` and server-side usage with `auth.api.signInSocial`, specifying the desired provider (e.g., 'google').

```ts
// client-side usage
await authClient.signIn.social({
  provider: "google", // or any other provider id
})
```

```ts
// server-side usage
await auth.api.signInSocial({
  body: {
    provider: "google", // or any other provider id
  },
});
```

--------------------------------

### Handle One Tap Prompt Dismissal with Fallback UI

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/one-tap.mdx

Implement onPromptNotification callback to detect when the One Tap prompt is dismissed or skipped after exponential backoff exhaustion. This allows rendering an alternative sign-in UI (like a traditional Google Sign-In button) for manual retry.

```typescript
await authClient.oneTap({
  onPromptNotification: (notification) => {
    console.warn("Prompt was dismissed or skipped. Consider displaying an alternative sign-in option.", notification);
  }
});
```

--------------------------------

### Initialize betterAuth Server Instance with PostgreSQL

Source: https://context7.com/better-auth/better-auth/llms.txt

Creates the core server-side authentication instance with PostgreSQL database connection, email/password authentication, GitHub and Google OAuth providers, and session configuration with 7-day expiration and cookie caching.

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true, // Auto sign-in after registration
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },
});
```

--------------------------------

### Configuration: disableIdTokenSignIn

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Disables the use of the ID token for sign-in for a social provider. By default, ID token sign-in is enabled for some providers like Google and Apple.

```APIDOC
## Configuration: disableIdTokenSignIn

### Description
Disables the use of the ID token for sign-in for a social provider. By default, ID token sign-in is enabled for some providers like Google and Apple.

### Method
Configuration Property

### Endpoint
N/A

### Parameters
#### Request Body
- **disableIdTokenSignIn** (boolean) - Optional - Set to `true` to disable ID token sign-in. Default is `false`.

### Request Example
```ts
betterAuth({
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableIdTokenSignIn: true
    }
  }
});
```

### Response
#### Success Response (N/A)
- **N/A** - This is a configuration property, not a direct API call with a response.
```

--------------------------------

### Social Sign-On with OAuth Providers - Better Auth

Source: https://context7.com/better-auth/better-auth/llms.txt

Authenticate users through social providers (GitHub, Google, Apple, Discord, etc.) using OAuth. Supports multiple authentication flows: OAuth redirect, ID token (for mobile apps), and access token. Includes callback URL customization for new user registration and error handling.

```typescript
import { authClient } from "@/lib/auth-client";

await authClient.signIn.social({
    provider: "github",
    callbackURL: "/dashboard",
    errorCallbackURL: "/error",
    newUserCallbackURL: "/welcome",
});

await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
});

await authClient.signIn.social({
    provider: "google",
    idToken: {
        token: googleIdToken,
    },
});

await authClient.signIn.social({
    provider: "github",
    accessToken: {
        token: githubAccessToken,
    },
});
```

--------------------------------

### Custom Function: refreshAccessToken

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

A custom function to refresh the access token. This feature is only supported for built-in social providers (Google, Facebook, GitHub, etc.) and is not currently supported for custom OAuth providers configured through the Generic OAuth Plugin.

```APIDOC
## Custom Function: refreshAccessToken

### Description
A custom function to refresh the token. This feature is only supported for built-in social providers (Google, Facebook, GitHub, etc.) and is not currently supported for custom OAuth providers configured through the Generic OAuth Plugin. For built-in providers, you can provide a custom function to refresh the token if needed.

### Method
Callback Function

### Endpoint
N/A

### Parameters
#### Request Body
- **refreshAccessToken** (function) - Optional - An async function that takes the current `token` object and returns an object containing `accessToken` (string) and `refreshToken` (string).
  - **token** (object) - The current token object, which may include `accessToken`, `refreshToken`, `expiresAt`, etc.

### Request Example
```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      refreshAccessToken: async (token) => {
        // Implement custom token refresh logic here
        return {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        };
      },
    },
  },
});
```

### Response
#### Success Response (N/A)
- **N/A** - This is a configuration property with a callback function, not a direct API call with a response.
```

--------------------------------

### ID Token Sign-In with Better Auth in React Native

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/expo.mdx

Implements ID token-based authentication where the provider request is made on the mobile device and the ID token is verified server-side. Supports Google, Apple, and Facebook providers. Accepts provider name, ID token from provider, optional nonce, and callback URL for post-authentication redirection.

```typescript
import { Button } from "react-native";

export default function SocialSignIn() {
    const handleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            idToken: {
                token: "...",
                nonce: "...",
            },
            callbackURL: "/dashboard"
        })
    };
    return <Button title="Login with Google" onPress={handleLogin} />;
}
```

--------------------------------

### Enable Experimental Joins Feature in Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/adapters/sqlite.mdx

Enable the experimental joins feature in Better Auth configuration to allow fetching related data from multiple tables in a single query, providing 2x to 3x performance improvements depending on database latency. Requires Kysely SQLite dialect version 1.4.0 or later.

```typescript
export const auth = betterAuth({
  experimental: { joins: true }
});
```

--------------------------------

### Retrieve and Manage Last Login Method

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/last-login-method.mdx

Use client plugin methods to retrieve the last used authentication method, check if a specific method was used, or clear the stored method. Returns method identifiers like 'google', 'email', 'github', etc.

```typescript
import { authClient } from "@/lib/auth-client"

// Get the last used login method
const lastMethod = authClient.getLastUsedLoginMethod()
console.log(lastMethod) // "google", "email", "github", etc.

// Check if a specific method was last used
const wasGoogle = authClient.isLastUsedLoginMethod("google")

// Clear the stored method
authClient.clearLastUsedLoginMethod()
```

--------------------------------

### READ - Find Single Record

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/guides/create-a-db-adapter.mdx

The findOne method retrieves a single record from the database based on where clause conditions. Supports optional join configuration for fetching related records in a single query.

```APIDOC
## GET Find Single Record

### Description
Finds and returns a single record from the database matching the specified where clause.

### Method
GET (Database Query Operation)

### Parameters
#### Required Parameters
- **model** (string) - Required - The model/table name to query
- **where** (object) - Required - The where clause conditions to find the record

#### Optional Parameters
- **select** (array) - Optional - Array of fields to return from the database
- **join** (object) - Optional - Join configuration to fetch related records in a single query

### Implementation Example
```typescript
findOne: async ({ model, where, select, join }) => {
  return await db.select().from(model).where(where).limit(1);
};
```

### Request Parameters
```typescript
{
  "model": "users",
  "where": {
    "email": "user@example.com"
  },
  "select": ["id", "email", "name"],
  "join": {
    "table": "profiles",
    "on": "users.id = profiles.userId"
  }
}
```

### Response
- **Returns** (object) - The found record with all requested fields

### Response Example
```typescript
{
  "id": "abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Notes
- Select parameter is for query optimization purposes only
- Framework handles field filtering based on select parameter
- Return the complete found record from the database
```

--------------------------------

### Configure Better Auth Captcha plugin in TypeScript

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/changelogs/1-2.mdx

This TypeScript example shows how to add the Captcha plugin to your `betterAuth` instance. It configures the plugin to use Cloudflare Turnstile or Google reCAPTCHA for protecting authentication flows, requiring a `secretKey`.

```ts
import { captcha } from "better-auth/plugins";

const auth = betterAuth({
  plugins: [
    captcha({
      provider: "cloudflare-turnstile", // or "google-recaptcha"
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    })
  ]
});
```

--------------------------------

### Configure TikTok Social Provider with Client Key

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

Set up TikTok OAuth provider using clientKey instead of clientId. The clientKey is TikTok's specific identifier for OAuth applications, paired with clientSecret for authentication.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    tiktok: {
      clientKey: "YOUR_TIKTOK_CLIENT_KEY",
      clientSecret: "YOUR_TIKTOK_CLIENT_SECRET",
    },
  },
});
```

--------------------------------

### Configure Captcha Plugin in Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/captcha.mdx

Initialize the captcha plugin with a provider and secret key in your Better Auth configuration. Supports Cloudflare Turnstile, Google reCAPTCHA, hCaptcha, and CaptchaFox providers. The plugin middleware automatically validates captcha tokens on protected endpoints.

```typescript
import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.TURNSTILE_SECRET_KEY!,
        }),
    ],
});
```

--------------------------------

### Configuration: clientKey

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/oauth.mdx

The client key of your application. This is used by TikTok Social Provider instead of `clientId` for authentication.

```APIDOC
## Configuration: clientKey

### Description
The client key of your application. This is used by TikTok Social Provider instead of `clientId`.

### Method
Configuration Property

### Endpoint
N/A

### Parameters
#### Request Body
- **clientKey** (string) - Required for TikTok - The client key provided by the social provider (e.g., TikTok).

### Request Example
```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    tiktok: {
      clientKey: "YOUR_TIKTOK_CLIENT_KEY",
      clientSecret: "YOUR_TIKTOK_CLIENT_SECRET",
    },
  },
});
```

### Response
#### Success Response (N/A)
- **N/A** - This is a configuration property, not a direct API call with a response.
```

--------------------------------

### Set Custom Issuer Name for 2FA Application

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/2fa.mdx

This TypeScript snippet illustrates how to configure a custom `issuer` name for the 2FA application within the `twoFactor` plugin. This allows the application name displayed in authenticator apps (e.g., Google Authenticator) to be customized from the default 'Better Auth' to a more specific application name.

```ts
twoFactor({
    issuer: "my-app-name" // [!code highlight]
})
```

--------------------------------

### Find Single Record with Adapter Method (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/guides/create-a-db-adapter.mdx

The `findOne` method retrieves a single record from the database. It accepts `model` (table name), a `where` clause for filtering, an optional `select` clause for specific fields, and an optional `join` configuration for related data. The method is expected to return the found data.

```ts
findOne: async ({ model, where, select, join }) => {
  // Example of finding a single record in the database.
  return await db.select().from(model).where(where).limit(1);
};
```

--------------------------------

### Configure Naver Social Provider in better-auth (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/naver.mdx

This code snippet demonstrates how to integrate Naver as a social login provider within the better-auth library. It requires `clientId` and `clientSecret` obtained from Naver Developers, typically stored as environment variables. The configuration is passed to the `socialProviders` option during the `betterAuth` instance creation.

```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    socialProviders: {
        naver: { 
            clientId: process.env.NAVER_CLIENT_ID as string, 
            clientSecret: process.env.NAVER_CLIENT_SECRET as string, 
        }, 
    }
})
```

--------------------------------

### Preload Convex Queries in Next.js Server Components

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/convex.mdx

Demonstrates preloading Convex queries in server components using preloadAuthQuery utility. Data is loaded on the server and passed to client components for rendering. Supports parallel loading of multiple queries.

```typescript
import { preloadAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

const Page = async () => {
    const [preloadedUserQuery] = await Promise.all([
        preloadAuthQuery(api.auth.getCurrentUser),
        // Load multiple queries in parallel if needed
    ]);

    return (
        <div>
            <Header preloadedUserQuery={preloadedUserQuery} />
        </div>
    );
};

export default Page;
```

--------------------------------

### Configure TikTok Social Provider in betterAuth (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/tiktok.mdx

This code snippet demonstrates how to integrate TikTok as a social authentication provider within the `betterAuth` configuration. It requires importing `betterAuth` and providing the `clientSecret` and `clientKey` (obtained from TikTok Developer Portal) as environment variables to the `tiktok` entry under `socialProviders`.

```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    socialProviders: {
        tiktok: {
            clientSecret: process.env.TIKTOK_CLIENT_SECRET as string,
            clientKey: process.env.TIKTOK_CLIENT_KEY as string,
        }
    },
})
```

--------------------------------

### Create and initialize Better Auth instance with Convex

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/convex.mdx

Initialize a Better Auth instance with Convex adapter and plugin, configure email/password authentication, and create a query function to retrieve the current authenticated user. The Convex plugin is required for proper integration.

```typescript
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
    return betterAuth({
        baseURL: siteUrl,
        database: authComponent.adapter(ctx),
        // Configure simple, non-verified email/password to get started
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
        },
        plugins: [
            // The Convex plugin is required for Convex compatibility
            convex({ authConfig }),
        ],
    });
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return authComponent.getAuthUser(ctx);
    },
});
```

--------------------------------

### Configure local environment variables for Convex cloud deployment

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/convex.mdx

Set up local .env.local file with Convex deployment credentials and URLs for cloud-hosted Convex backend. Includes Convex deployment ID, public URLs, and local site URL for development.

```shell
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:adjective-animal-123 # team: team-name, project: project-name

NEXT_PUBLIC_CONVEX_URL=https://adjective-animal-123.convex.cloud

# Same as NEXT_PUBLIC_CONVEX_URL but ends in .site
NEXT_PUBLIC_CONVEX_SITE_URL=https://adjective-animal-123.convex.site

# Your local site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

--------------------------------

### Configure Better Auth URL for Local Development (.env)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/spotify.mdx

This snippet shows how to set the `BETTER_AUTH_URL` environment variable to `http://127.0.0.1:3000` for local development when using Spotify as an authentication provider. This is crucial for matching the redirect URI configured in the Spotify Developer Dashboard.

```bash
BETTER_AUTH_URL=http://127.0.0.1:3000
```

--------------------------------

### Configure Next.js Server Utilities for Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/convex.mdx

Sets up helper functions for authenticated server-side rendering, server functions, and route handlers using Convex. Exports utilities like handler, preloadAuthQuery, isAuthenticated, and authentication token management. Requires Convex URL and site URL environment variables.

```typescript
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
    handler,
    preloadAuthQuery,
    isAuthenticated,
    getToken,
    fetchAuthQuery,
    fetchAuthMutation,
    fetchAuthAction,
} = convexBetterAuthNextJs({
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
    convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
```

--------------------------------

### SDK Call: searchTransactions

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/creem.mdx

Searches and retrieves transaction records for the authenticated user, allowing for optional filtering by product ID and pagination.

```APIDOC
## SDK Call: searchTransactions

### Description
Searches transaction records for the authenticated user. This client-side SDK method allows filtering by product and supports pagination to retrieve a list of transactions.

### Method
SDK Call

### Endpoint
`authClient.creem.searchTransactions()`

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A (parameters passed as object to SDK method)

#### Request Body
- **productId** (string) - Optional. An ID to filter transactions by a specific product.
- **pageNumber** (number) - Required. The page number to retrieve, starting from 1.
- **pageSize** (number) - Required. The maximum number of transactions per page.

### Request Example
```json
{
  "productId": "prod_xyz789",
  "pageNumber": 1,
  "pageSize": 50
}
```

### Response
#### Success Response (200)
- **transactions** (array) - A list of transaction objects.
  - **type** (string) - The type of transaction (e.g., 'purchase', 'refund').
  - **amount** (number) - The transaction amount.
  - **currency** (string) - The currency of the transaction (e.g., 'USD').

#### Response Example
```json
{
  "transactions": [
    {
      "type": "purchase",
      "amount": 19.99,
      "currency": "USD"
    },
    {
      "type": "renewal",
      "amount": 9.99,
      "currency": "USD"
    }
  ]
}
```

```

--------------------------------

### Remote JWT Signing with Key Management Service

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/jwt.mdx

Implements custom JWT signing using a remote Key Management Service (KMS) such as Google KMS, Amazon KMS, or Azure Key Vault. The sign function constructs the JWT, hashes the header and payload, sends to remote KMS for signing, and validates integrity before returning. Requires remote signing capability.

```typescript
jwt({
  jwks: {
    remoteUrl: "https://example.com/.well-known/jwks.json",
    keyPairConfig: {
      alg: 'ES256',
    },
  },
  jwt: {
    sign: async (jwtPayload: JWTPayload) => {
      // this is pseudocode
      const headers = JSON.stringify({ kid: '123', alg: 'ES256', typ: 'JWT' })
      const payload = JSON.stringify(jwtPayload)
      const encodedHeaders = Buffer.from(headers).toString('base64url')
      const encodedPayload = Buffer.from(payload).toString('base64url')
      const hash = createHash('sha256')
      const data = `${encodedHeaders}.${encodedPayload}`
      hash.update(Buffer.from(data))
      const digest = hash.digest()
      const sig = await remoteSign(digest)
      // integrityCheck(sig)
      const jwt = `${data}.${sig}`
      // verifyJwt(jwt)
      return jwt
    },
  },
})
```

--------------------------------

### Configure Spotify Social Provider in Better Auth (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/spotify.mdx

This TypeScript code demonstrates how to integrate Spotify as a social authentication provider within the `better-auth` configuration. It involves importing `betterAuth` and passing an object with `clientId` and `clientSecret` retrieved from environment variables to the `socialProviders.spotify` option.

```ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    
    socialProviders: {
        spotify: {
            clientId: process.env.SPOTIFY_CLIENT_ID as string,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
        },
    },
})
```

--------------------------------

### Configure Better Auth `trustedOrigins` for browser extensions (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/guides/browser-extension-guide.mdx

This configuration demonstrates how to set up `trustedOrigins` for `betterAuth` in a TypeScript server file. It illustrates both specifying a single Chrome extension ID for enhanced security and using a wildcard pattern for supporting multiple extensions, with a warning about reduced security for the latter.

```ts
import { betterAuth } from "better-auth"
import { auth } from "@/auth/auth"

export const auth = betterAuth({
    trustedOrigins: ["chrome-extension://YOUR_EXTENSION_ID"],
})
```

```ts
export const auth = betterAuth({
    trustedOrigins: [
        // Support a specific extension ID
        "chrome-extension://YOUR_EXTENSION_ID",
        
        // Or support multiple extensions with wildcard (less secure)
        "chrome-extension://*"
    ],
})
```

--------------------------------

### Enable Experimental Joins in Better-Auth Configuration (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/database.mdx

This configuration snippet demonstrates how to enable the experimental joins feature within your Better-Auth setup. By setting 'joins: true' under the 'experimental' key, Better-Auth will attempt to perform multiple database queries in a single request, optimizing data retrieval. This setting should be placed in your main authentication configuration file.

```typescript
export const auth = betterAuth({
  experimental: { joins: true }
});
```

--------------------------------

### Implement Better Auth Secondary Storage using Redis in TypeScript

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/database.mdx

This example provides a concrete implementation of the `SecondaryStorage` interface using the `redis` client library. It shows how to connect to Redis and map the `get`, `set`, and `delete` methods to Redis commands, including handling the optional `ttl` for expiring keys. This allows Better Auth to leverage Redis for session management and rate limiting, enhancing performance and scalability.

```typescript
import { createClient } from "redis";
import { betterAuth } from "better-auth";

const redis = createClient();
await redis.connect();

export const auth = betterAuth({
	// ... other options
	secondaryStorage: {
		get: async (key) => {
			return await redis.get(key);
		},
		set: async (key, value, ttl) => {
			if (ttl) await redis.set(key, value, { EX: ttl });
			// or for ioredis:
			// if (ttl) await redis.set(key, value, 'EX', ttl)
			else await redis.set(key, value);
		},
		delete: async (key) => {
			await redis.del(key);
		}
	}
});
```

--------------------------------

### Install PostgreSQL Client for Database Connection

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/guides/supabase-migration-guide.mdx

This command installs the 'pg' package, a non-blocking PostgreSQL client for Node.js. It is a prerequisite for connecting your application to a PostgreSQL database, which is required for Better Auth's data storage.

```bash
npm install pg
```

--------------------------------

### Sign In with Spotify using Better Auth Client (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/spotify.mdx

This TypeScript snippet illustrates how to initiate a Spotify social sign-in using the `better-auth/client` library. It shows the creation of an `authClient` instance and then calling `authClient.signIn.social` with `provider: "spotify"` to start the authentication flow.

```ts
import { createAuthClient } from "better-auth/client"
const authClient =  createAuthClient()

const signIn = async () => {
    const data = await authClient.signIn.social({
        provider: "spotify"
    })
}
```

--------------------------------

### Initiate TikTok Social Sign-In with betterAuth Client (TypeScript)

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/tiktok.mdx

This example illustrates how to trigger a social sign-in flow with TikTok using the `better-auth/client` library. It involves creating an auth client instance and then calling the `signIn.social` method, specifying "tiktok" as the provider.

```typescript
import { createAuthClient } from "better-auth/client"
const authClient =  createAuthClient()

const signIn = async () => {
    const data = await authClient.signIn.social({
        provider: "tiktok"
    })
}
```

--------------------------------

### Manually Configure and Sign-in with Instagram OAuth Provider in TypeScript

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/authentication/other-social-providers.mdx

This snippet illustrates how to manually configure an OAuth provider, like Instagram, that doesn't have a pre-configured helper. It involves specifying `providerId`, `clientId`, `clientSecret`, `authorizationUrl`, `tokenUrl`, and required `scopes` in `auth.ts`. The accompanying `sign-in.ts` code demonstrates initiating the authentication flow for this custom provider.

```ts
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config options
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "instagram",
          clientId: process.env.INSTAGRAM_CLIENT_ID as string,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET as string,
          authorizationUrl: "https://api.instagram.com/oauth/authorize",
          tokenUrl: "https://api.instagram.com/oauth/access_token",
          scopes: ["user_profile", "user_media"]
        }
      ]
    })
  ]
});
```

```ts
const response = await authClient.signIn.oauth2({
  providerId: "instagram",
  callbackURL: "/dashboard" // the path to redirect to after the user is authenticated
});
```

--------------------------------

### PUT /api/updateApiKey

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/plugins/api-key.mdx

Update the permissions for an existing API key. Provide the key ID and new permissions to replace the current permissions.

```APIDOC
## PUT /api/updateApiKey

### Description
Update the permissions of an existing API key. The new permissions will completely replace the current permissions.

### Method
PUT

### Endpoint
/api/updateApiKey

### Request Body
- **keyId** (string) - Required - The ID of the API key to update
- **permissions** (object) - Required - New permissions to assign
  - **[resourceType]** (string[]) - Array of permission strings for each resource type

### Headers
- **Authorization** (string) - Required - User authentication headers (user_headers)

### Request Example
```ts
const apiKey = await auth.api.updateApiKey({
  body: {
    keyId: existingApiKeyId,
    permissions: {
      files: ["read", "write", "delete"],
      users: ["read", "write"],
    },
  },
  headers: user_headers,
});
```

### Response
#### Success Response (200)
- **keyId** (string) - The ID of the updated API key
- **permissions** (object) - The updated permissions
- **userId** (string) - Associated user ID
- **updatedAt** (timestamp) - When the key was last updated

#### Response Example
```ts
{
  "keyId": "key_abc123",
  "permissions": {
    "files": ["read", "write", "delete"],
    "users": ["read", "write"]
  },
  "userId": "userId",
  "updatedAt": 1234567899
}
```
```

--------------------------------

### Social Provider Sign-In with Better Auth in React Native

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/expo.mdx

Implements social authentication using Better Auth's authClient.signIn.social() method with a provider and callback URL. The callback URL is automatically converted to a deep link on native platforms (e.g., myapp://dashboard). Requires authClient initialization and the provider to be configured in Better Auth.

```typescript
import { Button } from "react-native";

export default function SocialSignIn() {
    const handleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard"
        })
    };
    return <Button title="Login with Google" onPress={handleLogin} />;
}
```

--------------------------------

### Configure local environment variables for self-hosted Convex

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/convex.mdx

Set up local .env.local file for self-hosted Convex backend. Includes local deployment credentials and URLs with site URL typically one port number higher than the Convex URL.

```shell
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:adjective-animal-123 # team: team-name, project: project-name

NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# Will generally be one number higher than NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211

# Your local site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

--------------------------------

### Enable Database Joins Optimization

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/blogs/1-4.mdx

Enable experimental database joins feature to improve query performance across 50+ endpoints by 2-3x latency reduction. Requires re-running migrations to update schema with join support.

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    experimental: {
        joins: true,
    },
});
```

--------------------------------

### Define SecondaryStorage Interface in TypeScript

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/database.mdx

This TypeScript interface outlines the contract for a secondary storage mechanism used by Better Auth. It specifies methods for getting, setting, and deleting key-value pairs, with an optional time-to-live for set operations. Implementations of this interface allow Better Auth to integrate with various caching or external storage systems.

```typescript
interface SecondaryStorage {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}
```

--------------------------------

### Configure PostgreSQL Database with Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/installation.mdx

Setup Better Auth with PostgreSQL database using the pg driver and connection pool. Requires the pg package to be installed and PostgreSQL connection options to be configured.

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
    database: new Pool({
        // connection options
    }),
})
```

--------------------------------

### Configure SQLite Database with Better Auth

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/installation.mdx

Setup Better Auth with SQLite database using the better-sqlite3 driver. This creates a local SQLite database file for storing user data. Requires the better-sqlite3 package to be installed.

```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
    database: new Database("./sqlite.db"),
})
```

--------------------------------

### Set Convex site URL environment variable

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/integrations/convex.mdx

Configure the site URL environment variable in your Convex deployment. This URL is used for authentication callbacks and session management.

```shell
npx convex env set SITE_URL http://localhost:3000
```

--------------------------------

### Configure PostgreSQL Non-Default Schema via Pool Options

Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/adapters/postgresql.mdx

Set a non-default schema for Better Auth by specifying individual Pool connection parameters and the options flag with search_path. This approach provides more granular control over connection settings compared to connection strings.

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "password",
    database: "my-db",
    options: "-c search_path=auth",
  }),
});
```
