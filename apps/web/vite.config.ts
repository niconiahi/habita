import mdx from "@mdx-js/rollup"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  optimizeDeps: {
    include: ["valibot"],
  },
  ssr: {
    external: ["bun"],
    noExternal: [],
  },
  build: {
    rollupOptions: {
      external: ["bun"],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["dev.habita.rent", "app"],
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  plugins: [
    tailwindcss(),
    mdx({
      jsxImportSource: "react",
      development: process.env.NODE_ENV === "development",
    }),
    reactRouter(),
    tsconfigPaths(),
    {
      name: "suppress-devtools-request",
      configureServer(server) {
        server.middlewares.use(
          "/.well-known",
          (_, response) => {
            response.statusCode = 404
            response.end()
          },
        )
      },
    },
  ],
})
