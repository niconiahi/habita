import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import { mdsvex } from "mdsvex"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: [vitePreprocess(), mdsvex()],

  kit: {
    adapter: adapter(),
    alias: {
      db: "./db",
      $icon: "./src/icon",
    },
    router: {
      resolution: "server",
    },
    experimental: {
      remoteFunctions: true,
    },
  },
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
  extensions: [".svelte", ".svx"],
}

export default config
