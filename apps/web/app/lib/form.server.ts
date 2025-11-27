import * as v from "valibot"

export function normalize_input(
  form_data: FormData,
  schema: v.ObjectSchema<any, any>,
) {
  const form_object: { [k: string]: unknown | undefined } = {}
  const schema_keys = Object.keys(schema.entries)

  for (const key of schema_keys) {
    const value = form_data.get(key)
    form_object[key] = value !== null ? value : undefined
  }

  return form_object
}

export function get_errors<
  TSchema extends v.BaseSchema<any, any, any>,
>(
  error: v.ValiError<TSchema>,
): Partial<Record<keyof v.InferInput<TSchema>, string>> {
  const errors = Object.fromEntries(
    error.issues.map((issue) => [
      issue.path?.[0]?.key,
      issue.message,
    ]),
  ) as Partial<Record<keyof v.InferInput<TSchema>, string>>
  return errors
}
