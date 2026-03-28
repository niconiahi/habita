import {
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/svelte"
import type { auth } from "./server/auth"

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
