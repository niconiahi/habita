import type * as v from "valibot"

function isEmptyFile(
  value: FormDataEntryValue | null,
): boolean {
  return (
    value instanceof File &&
    value.size === 0 &&
    (value.name === "" || value.name === "blob")
  )
}

function getType(schema: unknown): string {
  if (typeof schema !== "object" || schema === null)
    return "unknown"
  if (!("type" in schema)) return "unknown"
  const type = schema.type
  if (
    (type === "optional" || type === "nullish") &&
    "wrapped" in schema
  ) {
    return getType(schema.wrapped)
  }
  return typeof type === "string" ? type : "unknown"
}

function unwrap_schema(schema: unknown): unknown {
  if (typeof schema !== "object" || schema === null)
    return schema
  if (!("type" in schema)) return schema
  const type = schema.type
  if (
    (type === "optional" || type === "nullish") &&
    "wrapped" in schema
  ) {
    return unwrap_schema(schema.wrapped)
  }
  return schema
}

function get_array_item_type(schema: unknown): string {
  const unwrapped = unwrap_schema(schema)
  if (
    typeof unwrapped === "object" &&
    unwrapped !== null &&
    "item" in unwrapped
  ) {
    return getType(unwrapped.item)
  }
  return "unknown"
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
        const items = formData.getAll(key)
        const item_type = get_array_item_type(schema)
        if (
          item_type === "number" ||
          item_type === "picklist"
        ) {
          return [key, items.map(Number)]
        }
        return [key, items]
      }
      if (type === "number") {
        const value = formData.get(key)
        if (value === null || value === "") {
          return [key, undefined]
        }
        return [key, Number(value)]
      }
      const value = formData.get(key)
      if (value === null || value === "") {
        return [key, undefined]
      }
      if (isEmptyFile(value)) {
        return [key, undefined]
      }
      return [key, value]
    }),
  )
}
