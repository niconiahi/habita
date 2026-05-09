import * as v from "valibot"
import {
  command,
  getRequestEvent,
  query,
} from "$app/server"

const KEY_SCHEMA = v.picklist(["characteristics", "sections"])

export const get_current_disclosure = query(
  KEY_SCHEMA,
  (key) => {
    const { cookies } = getRequestEvent()
    return cookies.get(`current_disclosure_${key}`) ?? null
  },
)

export const set_current_disclosure = command(
  v.object({ key: KEY_SCHEMA, value: v.string() }),
  async ({ key, value }) => {
    const { cookies } = getRequestEvent()
    const name = `current_disclosure_${key}`
    if (value === "") {
      cookies.delete(name, { path: "/" })
    } else {
      cookies.set(name, value, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    void get_current_disclosure(key).refresh()
  },
)
