import Redis from "ioredis";

if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set");

const client = new Redis(process.env.REDIS_URL);

export const kv = {
  async del(key: string): Promise<number> {
    return await client.del(key);
  },

  async hlen(key: string): Promise<number> {
    return await client.hlen(key);
  },

  async hgetall(key: string): Promise<Record<string, string> | null> {
    return await client.hgetall(key);
  },

  async hmset(key: string, fields: string[]): Promise<string> {
    return await client.hmset(key, ...fields);
  }
};
