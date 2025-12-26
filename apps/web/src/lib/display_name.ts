import type { User } from "db/types"

export function display_name(
  user: Pick<User, "name" | "surname">,
) {
  return [user.name, user.surname].join(" ")
}
