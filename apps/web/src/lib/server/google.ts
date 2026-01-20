import { Google } from "arctic"
import { lazy } from "$lib/server/lazy"

export const google = lazy<Google>(() => {
  if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not set")
  if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET is not set")
  if (!process.env.GOOGLE_REDIRECT_URL) throw new Error("GOOGLE_REDIRECT_URL is not set")

  return new Google(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL,
  )
})
