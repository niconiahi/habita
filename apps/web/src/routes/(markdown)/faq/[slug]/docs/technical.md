# /faq/[slug]

## Loader

Fetches article by slug via `fetch_article(slug)`. Returns 404 if not found. Article content is pre-rendered as HTML by the loader.

## Actions

None — read-only page.

## Auth

None — public page.

## Notes

- Content rendered via `{@html article.content}` — HTML safety delegated to loader
- Wrapped in `<article class="markdown">` for styling
