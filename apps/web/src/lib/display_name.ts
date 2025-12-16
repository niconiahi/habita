import type { User } from "$lib/server/db/types";

export function display_name(user: Pick<User, "name" | "surname">) {
  return [user.name, user.surname].join(" ");
}
