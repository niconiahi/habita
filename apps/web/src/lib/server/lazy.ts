const is_dev = process.env.NODE_ENV !== "production"

const cache = (is_dev
  ? ((globalThis as Record<string, unknown>).__lazy ??=
      new Map<string, object>())
  : new Map<string, object>()) as Map<string, object>

function get_caller_key(): string {
  const stack = new Error().stack
  if (!stack) return Math.random().toString(36)
  const lines = stack.split("\n")
  return lines[3]?.trim() ?? lines[2]?.trim() ?? ""
}

export function lazy<T extends object>(create: () => T): T {
  const key = get_caller_key()

  if (cache.has(key)) {
    return cache.get(key) as T
  }

  const instance = create()
  cache.set(key, instance)
  return instance
}
