import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import mdx from "@mdx-js/rollup"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import remark_frontmatter from "remark-frontmatter"
import remark_mdx_frontmatter from "remark-mdx-frontmatter"
import type { Plugin } from "vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const FONTS_DIR = "public/fonts"
const BUILD_DIR = "build/client"

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
      remarkPlugins: [
        remark_frontmatter,
        remark_mdx_frontmatter,
      ],
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
    font_hasher(),
  ],
})
function font_hasher(): Plugin {
  return {
    name: "font-hasher",
    writeBundle() {
      const source_path = path.join(
        process.cwd(),
        FONTS_DIR,
      )
      const build_assets_path = path.join(
        process.cwd(),
        BUILD_DIR,
        "assets",
      )
      if (!fs.existsSync(source_path)) {
        console.warn(
          "Fonts directory not found:",
          source_path,
        )
        return
      }
      const font_files = fs
        .readdirSync(source_path)
        .filter(
          (file) =>
            file.endsWith(".ttf") ||
            file.endsWith(".otf") ||
            file.endsWith(".woff") ||
            file.endsWith(".woff2"),
        )
      const font_mapping: Record<string, string> = {}
      for (const font_file of font_files) {
        const font_path = path.join(source_path, font_file)
        const content = fs.readFileSync(font_path)
        const hash = createHash("sha256")
          .update(content)
          .digest("hex")
          .slice(0, 24)
        const [name, extension] = font_file.split(".")
        const hashed_file_name = `${name}-${hash}.${extension}`
        const target_path = path.join(
          build_assets_path,
          hashed_file_name,
        )
        fs.mkdirSync(path.dirname(target_path), {
          recursive: true,
        })
        fs.writeFileSync(target_path, content)
        font_mapping[font_file] = hashed_file_name
      }
      if (!fs.existsSync(build_assets_path)) {
        return
      }
      const css_files = fs
        .readdirSync(build_assets_path)
        .filter((file) => file.endsWith(".css"))
      for (const css_file of css_files) {
        const css_path = path.join(
          build_assets_path,
          css_file,
        )
        let css_content = fs.readFileSync(css_path, "utf-8")
        let modified = false
        for (const [
          original_file,
          hashed_file,
        ] of Object.entries(font_mapping)) {
          const original_url = `/fonts/${original_file}`
          const hashed_url = `/assets/${hashed_file}`
          if (css_content.includes(original_url)) {
            css_content = css_content.replace(
              new RegExp(original_url, "g"),
              hashed_url,
            )
            modified = true
          }
        }
        if (modified) {
          fs.writeFileSync(css_path, css_content)
        }
      }
    },
  }
}
