import type * as v from "valibot"


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

function isEmptyFile(value: FormDataEntryValue | null): boolean {
  return (
    value instanceof File &&
    value.size === 0 &&
    (value.name === "" || value.name === "blob")
  )
}

function getType(schema: unknown): string {
  if (typeof schema !== "object" || schema === null) return "unknown"
  if (!("type" in schema)) return "unknown"
  const type = schema.type
  if ((type === "optional" || type === "nullish") && "wrapped" in schema) {
    return getType(schema.wrapped)
  }
  return typeof type === "string" ? type : "unknown"
}

export function normalize_input<
  T extends v.ObjectSchema<v.ObjectEntries, undefined>,
>(formData: FormData, schema: T) {
  const entries = schema.entries
  return Object.fromEntries(
    Object.entries(entries).map(([key, schema]) => {
      const type = getType(schema)
      if (type === "boolean") {
        return [key, formData.get(key) === "on"]
      }
      if (type === "array") {
        return [key, formData.getAll(key)]
      }
      if (type === "number") {
        const value = formData.get(key)
        if (value === null || value === "") {
          return [key, undefined]
        }
        return [key, Number(value)]
      }
      const value = formData.get(key)
      if (isEmptyFile(value)) {
        return [key, undefined]
      }
      return [key, value]
    }),
  )
}
