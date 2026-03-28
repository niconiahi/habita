import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

const ALLOWED_EMAIL_DOMAIN = "@habita.rent"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }

  if (!locals.user.email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    redirect(302, "/chat")
  }
}
