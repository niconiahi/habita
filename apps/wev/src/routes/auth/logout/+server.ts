import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import type { RequestHandler } from "./$types";
import { invalidate_session } from "$lib/server/auth";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "$lib/server/cookies";

export const POST: RequestHandler = async ({ cookies }) => {
  const session_token = cookies.get(SESSION_COOKIE_NAME);

  if (session_token) {
    const session_id = encodeHexLowerCase(
      sha256(new TextEncoder().encode(session_token)),
    );
    await invalidate_session(session_id);
  }

  cookies.set(SESSION_COOKIE_NAME, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  redirect(302, `${base}/properties`);
};
