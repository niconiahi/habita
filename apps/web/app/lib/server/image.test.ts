import { describe, it, expect, beforeAll } from "vitest"
import { get_img_props } from "./image"

describe("image transformation utilities", () => {
  beforeAll(() => {
    process.env.IMGPROXY_KEY =
      "5c2d7ae4fcabbe4409b5bc0ae6bcae0933f53eeeb2cdb78ecb8bb4338dfc2765"
    process.env.IMGPROXY_SALT =
      "cdeb431b19aeccf61b90bdfbbb3b52b8ff197e50278f293c2a51d37eed1a02d9"
  })

  describe("get_img_props", () => {
    it("should generate correct image props for responsive images", () => {
      const file_id = 3
      const hash =
        "37f22e5658e9aab169de168f7ee7c73d8d022b00e55cec865c27c035a9c5b0c7"
      const img_props = get_img_props(file_id, hash, {
        widths: [400, 800, 1200],
        sizes: [
          "(max-width: 640px) 400px",
          "(max-width: 1024px) 800px",
          "1200px",
        ],
        className: "property-image",
      })
      expect(img_props.className).toBe("property-image")
      expect(img_props.src).toMatch(
        /^https:\/\/dev\.memudo\.rent\/image\/[A-Za-z0-9_-]+\/rs:fit:800:0:0\/q:85\/format:webp\//,
      )
      expect(img_props.srcSet).toContain("400w")
      expect(img_props.srcSet).toContain("800w")
      expect(img_props.srcSet).toContain("1200w")
      expect(img_props.srcSet).toContain("rs:fit:400:0:0")
      expect(img_props.srcSet).toContain("rs:fit:800:0:0")
      expect(img_props.srcSet).toContain("rs:fit:1200:0:0")
      expect(img_props.sizes).toBe(
        "(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px",
      )
      const source_url_base64 = Buffer.from(
        `https://dev.habita.rent/files/${file_id}?v=${hash}`,
      ).toString("base64url")
      expect(img_props.src).toContain(source_url_base64)
      expect(img_props.srcSet).toContain(source_url_base64)
    })

    it("should apply custom transformations", () => {
      const file_id = 3
      const hash =
        "37f22e5658e9aab169de168f7ee7c73d8d022b00e55cec865c27c035a9c5b0c7"
      const img_props = get_img_props(file_id, hash, {
        widths: [600],
        sizes: ["600px"],
        transformations: {
          width: 600,
          resize_type: "fill",
          format: "jpg",
          quality: 90,
        },
      })
      expect(img_props.src).toContain("rs:fill:600:0:0")
      expect(img_props.src).toContain("q:90")
      expect(img_props.src).toContain("format:jpg")
    })

    it("should use default quality and format when not specified", () => {
      const file_id = 3
      const hash =
        "37f22e5658e9aab169de168f7ee7c73d8d022b00e55cec865c27c035a9c5b0c7"
      const img_props = get_img_props(file_id, hash, {
        widths: [500],
        sizes: ["500px"],
      })
      expect(img_props.src).toContain("q:85")
      expect(img_props.src).toContain("format:webp")
    })

    it("should generate different signatures for different widths", () => {
      const file_id = 3
      const hash =
        "37f22e5658e9aab169de168f7ee7c73d8d022b00e55cec865c27c035a9c5b0c7"
      const img_props = get_img_props(file_id, hash, {
        widths: [400, 800],
        sizes: ["400px", "800px"],
      })
      const srcset_urls = img_props.srcSet.split(", ")
      const url_400 = srcset_urls[0].split(" ")[0]
      const url_800 = srcset_urls[1].split(" ")[0]
      const sig_400 = url_400
        .split("/image/")[1]
        .split("/")[0]
      const sig_800 = url_800
        .split("/image/")[1]
        .split("/")[0]
      expect(sig_400).not.toBe(sig_800)
    })
  })
})
