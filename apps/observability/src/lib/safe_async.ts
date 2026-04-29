export async function safe_async<T>(
  promise: Promise<T>,
): Promise<[Error, null] | [null, T]> {
  try {
    const result = await promise
    return [null, result]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [new Error(String(error)), null]
  }
}
