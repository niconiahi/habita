import type { ActionFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { sha256 } from "@oslojs/crypto/sha2"
import { encodeHexLowerCase } from "@oslojs/encoding"
import { invalidate_session } from "~/lib/server/auth"
import { session_cookie } from "~/lib/server/session"

export async function action({
  request,
}: ActionFunctionArgs) {
  const session_token = await session_cookie.parse(
    request.headers.get("Cookie"),
  )
  if (session_token) {
    const session_id = encodeHexLowerCase(
      sha256(new TextEncoder().encode(session_token)),
    )
    await invalidate_session(session_id)
  }
  return redirect("/", {
    headers: {
      "Set-Cookie": await session_cookie.serialize("", {
        maxAge: 0,
      }),
    },
  })
}

