import { RedisClient } from "@iuioiua/redis"
import { connect } from "node:net"

if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set")

const url = new URL(process.env.REDIS_URL)
const port = Number.parseInt(url.port)
const hostname = url.hostname

if (!port) throw new Error("REDIS_URL must include a port")
if (!hostname) throw new Error("REDIS_URL must include a hostname")

const connection = connect({ port, host: hostname })
const client = new RedisClient(connection)

export const kv = {
  async del(key: string): Promise<number> {
    return (await client.sendCommand(["DEL", key])) as number
  },

  async hlen(key: string): Promise<number> {
    return (await client.sendCommand(["HLEN", key])) as number
  },

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const result = (await client.sendCommand(["HGETALL", key])) as string[]
    if (result.length === 0) return null

    const hash: Record<string, string> = {}
    for (let i = 0; i < result.length; i += 2) {
      hash[result[i]] = result[i + 1]
    }
    return hash
  },

  async hmset(key: string, fields: string[]): Promise<string> {
    return (await client.sendCommand(["HMSET", key, ...fields])) as string
  },
}
