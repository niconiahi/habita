import { require_authentication } from "$lib/server/auth"
import type { PageServerLoad } from "./$types"

const ALLOWED_EMAIL_DOMAIN = "@habita.rent"

export const load: PageServerLoad = async ({ locals }) => {
  require_authentication(locals)

  if (!locals.user.email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    redirect(302, "/chat")
  }
}
