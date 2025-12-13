import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { query_builder } from "$lib/server/db/query_builder";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function generate_session_token() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}

export async function create_session(token: string, user_id: number) {
  const session_id = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token)),
  );
  const session = {
    id: session_id,
    user_id,
    expires_at: new Date(Date.now() + DAY_IN_MS * 30),
    created_at: new Date(),
    updated_at: new Date(),
  };
  await query_builder.insertInto("session").values(session).execute();
  return session;
}

export async function validate_session_token(token: string) {
  const session_id = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token)),
  );
  const result = await query_builder
    .selectFrom("session")
    .innerJoin("user", "session.user_id", "user.id")
    .where("session.id", "=", session_id)
    .select([
      "session.id",
      "session.user_id",
      "session.expires_at",
      "session.created_at",
      "session.updated_at",
      "user.id as user_id",
      "user.email",
    ])
    .executeTakeFirst();

  if (!result) {
    return { session: null, user: null };
  }

  const session = {
    id: result.id,
    user_id: result.user_id,
    expires_at: result.expires_at,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
  const user = {
    id: result.user_id,
    email: result.email,
  };

  const session_expired = Date.now() >= session.expires_at.getTime();
  if (session_expired) {
    await query_builder
      .deleteFrom("session")
      .where("id", "=", session.id)
      .execute();
    return { session: null, user: null };
  }

  const renew_session =
    Date.now() >= session.expires_at.getTime() - DAY_IN_MS * 15;
  if (renew_session) {
    session.expires_at = new Date(Date.now() + DAY_IN_MS * 30);
    await query_builder
      .updateTable("session")
      .set({ expires_at: session.expires_at })
      .where("id", "=", session.id)
      .execute();
  }

  return { session, user };
}

export type SessionValidationResult = Awaited<
  ReturnType<typeof validate_session_token>
>;

export async function invalidate_session(session_id: string) {
  await query_builder
    .deleteFrom("session")
    .where("id", "=", session_id)
    .execute();
}
