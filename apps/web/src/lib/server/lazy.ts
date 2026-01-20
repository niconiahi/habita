export function lazy<T extends object>(create: () => T): T {
  let instance: T | null = null

  return new Proxy({} as T, {
    get(_, prop) {
      if (!instance) instance = create()
      const value = instance[prop as keyof T]
      return typeof value === "function" ? value.bind(instance) : value
    },
  })
}
