import { createHmac } from "node:crypto"
import { get_origin } from "./origin"

type ImageOptions = {
  width: number
  resize_type?: "fit" | "fill" | "auto" | "force"
  format?: "jpg" | "png" | "webp" | "avif" | "gif"
  quality?: number
}

type GetImgPropsOptions = {
  widths: Array<number>
  sizes: Array<string>
  transformations?: ImageOptions
  className?: string
}

function get_env_var(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Environment variable ${name} is not set`,
    )
  }
  return value
}

function sign_path(path: string): string {
  const key = get_env_var("IMGPROXY_KEY")
  const salt = get_env_var("IMGPROXY_SALT")
  const key_buffer = Buffer.from(key, "hex")
  const salt_buffer = Buffer.from(salt, "hex")
  const hmac = createHmac("sha256", key_buffer)
  hmac.update(salt_buffer)
  hmac.update(path)
  return hmac.digest("base64url")
}

function build_processing_options(
  options: ImageOptions,
): string {
  const parts: string[] = []
  const resize_type = options.resize_type || "fit"
  const HEIGHT = 0 // means it gets autocalculated based on aspect ratio
  parts.push(
    `rs:${resize_type}:${options.width}:${HEIGHT}:0`,
  )
  if (options.quality !== undefined) {
    parts.push(`q:${options.quality}`)
  }
  if (options.format) {
    parts.push(`format:${options.format}`)
  }
  return parts.join("/")
}

function generate_image_url(
  file_id: number,
  hash: string,
  options: ImageOptions,
): string {
  const origin = get_origin()
  const source_url = `${origin}/files/${file_id}?v=${hash}`
  const encoded_source_url =
    Buffer.from(source_url).toString("base64url")
  const processing_options =
    build_processing_options(options)
  const path = `/${processing_options}/${encoded_source_url}`
  const signature = sign_path(path)
  return `${origin}/image/${signature}${path}`
}

export function get_img_props(
  file_id: number,
  hash: string,
  {
    widths,
    sizes,
    transformations,
    className,
  }: GetImgPropsOptions,
) {
  const average_size = Math.ceil(
    widths.reduce((a, s) => a + s) / widths.length,
  )
  return {
    className,
    src: generate_image_url(file_id, hash, {
      quality: 100,
      format: "webp",
      ...transformations,
      width: average_size,
    }),
    srcSet: widths
      .map((width) =>
        [
          generate_image_url(file_id, hash, {
            quality: 100,
            format: "webp",
            ...transformations,
            width,
          }),
          `${width}w`,
        ].join(" "),
      )
      .join(", "),
    sizes: sizes.join(", "),
  } as const
}
