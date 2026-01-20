import Redis from "ioredis"
import { lazy } from "$lib/server/lazy"

const client = lazy<Redis>(() => {
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set")
  return new Redis(process.env.REDIS_URL)
})

export const kv = {
  async del(key: string): Promise<number> {
    return await client.del(key)
  },

  async hlen(key: string): Promise<number> {
    return await client.hlen(key)
  },

  async hgetall(
    key: string,
  ): Promise<Record<string, string> | null> {
    return await client.hgetall(key)
  },

  async hmset(
    key: string,
    fields: string[],
  ): Promise<string> {
    return await client.hmset(key, ...fields)
  },
}
