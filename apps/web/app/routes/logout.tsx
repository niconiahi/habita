import { sha256 } from "@oslojs/crypto/sha2"
import { encodeHexLowerCase } from "@oslojs/encoding"
import type { ActionFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { invalidate_session } from "~/lib/auth.server"
import { session_cookie } from "~/lib/session.server"

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
