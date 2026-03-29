import Redis from "ioredis"
import { lazy } from "$lib/server/lazy"

const client = lazy<Redis>(() => {
  if (!process.env.REDIS_URL)
    throw new Error("REDIS_URL is not set")
  return new Redis(process.env.REDIS_URL)
})

export const kv = {
  async get(key: string): Promise<string | null> {
    return await client.get(key)
  },

  async set(
    key: string,
    value: string,
    seconds?: number,
  ): Promise<string> {
    if (seconds) {
      return await client.set(key, value, "EX", seconds)
    }
    return await client.set(key, value)
  },

  async del(key: string): Promise<number> {
    return await client.del(key)
  },
}
