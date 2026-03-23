const is_dev = process.env.NODE_ENV !== "production"

// In dev, Vite HMR re-executes modules on file changes.
// Module-level singletons (database pools, auth instances)
// get recreated but old ones are never cleaned up because
// their TCP connections keep them alive in memory.
// Storing instances on globalThis makes them survive HMR.
//
// The cache key is a hash of the factory function's source.
// Same source = same instance reused across HMR cycles.
// Changed source = new instance (you changed the code).
//
// In production, there is no HMR. Each instance lives in
// a module-scoped closure — simple and no globalThis needed.
const hmr_cache = ((globalThis as Record<string, unknown>)
  .__lazy_hmr_cache ??= new Map<string, object>()) as Map<
    string,
    object
  >

function hash(source: string): string {
  let h = 0
  for (let i = 0; i < source.length; i++) {
    h = (Math.imul(31, h) + source.charCodeAt(i)) | 0
  }
  return h.toString(36)
}

export function lazy<T extends object>(create: () => T): T {
  if (is_dev) {
    const key = hash(create.toString())
    return new Proxy({} as T, {
      get(_, prop) {
        if (!hmr_cache.has(key)) hmr_cache.set(key, create())
        const instance = hmr_cache.get(key) as T
        const value = instance[prop as keyof T]
        return typeof value === "function"
          ? value.bind(instance)
          : value
      },
    })
  }

  let instance: T | null = null

  return new Proxy({} as T, {
    get(_, prop) {
      if (!instance) instance = create()
      const value = instance[prop as keyof T]
      return typeof value === "function"
        ? value.bind(instance)
        : value
    },
  })
}
