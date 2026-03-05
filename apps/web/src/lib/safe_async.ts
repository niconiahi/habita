export async function safe_async<T>(
  promise: Promise<T>,
): Promise<[null, T] | [Error, null]> {
  try {
    const data = await promise
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
