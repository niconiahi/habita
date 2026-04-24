import { sveltekit } from "@sveltejs/kit/vite"
import { playwright } from "@vitest/browser-playwright"
import fs from "fs"
import devtoolsJson from "vite-plugin-devtools-json"
import { defineConfig, type Plugin } from "vitest/config"

function font_cache_plugin(): Plugin {
  return {
    name: "font-cache",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          req.url?.endsWith(".ttf") ||
          req.url?.endsWith(".woff2")
        ) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          )
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    sveltekit(),
    devtoolsJson(),
    font_cache_plugin(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5174,
    allowedHosts: ["dev.habita.rent", "svelte", "app"],
    fs: {
      allow: [".."],
    },
    https: fs.existsSync("/certs/dev.habita.rent.pem")
      ? {
          cert: fs.readFileSync(
            "/certs/dev.habita.rent.pem",
          ),
          key: fs.readFileSync(
            "/certs/dev.habita.rent-key.pem",
          ),
        }
      : undefined,

    hmr: {
      protocol: "wss",
      host: "dev.habita.rent",
      clientPort: 443,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              { browser: "chromium", headless: true },
            ],
          },
          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"],
        },
      },
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
})
