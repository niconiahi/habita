export function safe_sync<T>(
  fn: () => T,
): [null, T] | [Error, null] {
  try {
    const data = fn()
    return [null, data]
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(
            "unknown error while executing operation",
          )
    return [err, null]
  }
}
