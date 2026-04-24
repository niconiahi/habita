import Redis from "ioredis"

function make_redis() {
  if (!process.env.REDIS_URL)
    throw new Error("REDIS_URL is not set")
  return new Redis(process.env.REDIS_URL)
}

function get_client(): Redis {
  const client = (globalThis.__redis ??=
    make_redis()) as Redis
  return client
}

export const kv = {
  async get(key: string): Promise<string | null> {
    return await get_client().get(key)
  },

  async set(
    key: string,
    value: string,
    seconds?: number,
  ): Promise<string> {
    if (seconds) {
      return await get_client().set(
        key,
        value,
        "EX",
        seconds,
      )
    }
    return await get_client().set(key, value)
  },

  async del(key: string): Promise<number> {
    return await get_client().del(key)
  },

  async incr(key: string): Promise<number> {
    return await get_client().incr(key)
  },

  async expire(
    key: string,
    seconds: number,
  ): Promise<number> {
    return await get_client().expire(key, seconds)
  },
}
