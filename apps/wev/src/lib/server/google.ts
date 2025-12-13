import { Google } from "arctic";

if (!process.env.GOOGLE_CLIENT_ID)
  throw new Error("GOOGLE_CLIENT_ID is not set");
if (!process.env.GOOGLE_CLIENT_SECRET)
  throw new Error("GOOGLE_CLIENT_SECRET is not set");
if (!process.env.GOOGLE_REDIRECT_URL)
  throw new Error("GOOGLE_REDIRECT_URL is not set");

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);
