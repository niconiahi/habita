# /learn (layout)

## Layout (`+layout.svelte`)

Client-side layout. Calls `fetch_articles()` to get the full article list and renders a sidebar Dashboard navigation with links to each article by slug.

## Key Components

Dashboard (Root/Section/Link)

## Notes

- Articles are fetched client-side in the layout, not via a server loader
- No auth required — public content
