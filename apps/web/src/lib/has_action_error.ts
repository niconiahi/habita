import type * as v from "valibot"

type ActionError = {
  input?: v.FlatErrors<undefined>
  execution?: string
}

export function has_action_error<K extends string>(
  form: unknown,
  key: K,
): form is { errors: Record<K, ActionError> } {
  if (!form || typeof form !== "object") return false
  if (!("errors" in form)) return false
  const { errors } = form
  if (!errors || typeof errors !== "object") return false
  return key in errors
}
