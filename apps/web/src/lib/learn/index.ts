import { marked } from "marked";
import booking_raw from "./booking.md?raw";

interface Article {
  slug: string;
  title: string;
  content: string;
}

function parse_markdown(raw: string): Article {
  const frontmatter_regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = raw.match(frontmatter_regex);

  if (!match) {
    throw new Error("Invalid markdown frontmatter");
  }

  const [, frontmatter, body] = match;
  const metadata: Record<string, string> = {};

  for (const line of frontmatter.split("\n")) {
    const [key, ...values] = line.split(":");
    if (key && values.length) {
      metadata[key.trim()] = values.join(":").trim();
    }
  }

  return {
    slug: metadata.slug,
    title: metadata.title,
    content: marked.parse(body) as string,
  };
}

export const articles: Article[] = [
  parse_markdown(booking_raw),
];

export function get_article(slug: string): Article | null {
  return articles.find((a) => a.slug === slug) ?? null;
}
