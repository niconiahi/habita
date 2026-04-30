import { readFileSync } from "node:fs"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

function load_cert() {
  try {
    return {
      key: readFileSync("/certs/dev.habita.rent-key.pem"),
      cert: readFileSync("/certs/dev.habita.rent.pem"),
    }
  } catch {
    return false
  }
}

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: "0.0.0.0",
    port: 5175,
    https: load_cert(),
    allowedHosts: [
      "observability.dev.habita.rent",
      "observability-ui",
    ],
  },
})
