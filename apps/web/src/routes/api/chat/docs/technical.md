# /api/chat

## Endpoint (`+server.ts` — POST)

Receives chat messages, validates with `ChatRequestSchema`, and returns a streaming NDJSON response.

### Architecture

Uses OpenAI tool-calling (gpt-4o-mini) instead of context stuffing. The system prompt contains only behavioral rules (~2K tokens). All platform knowledge is accessed through 4 tools backed by a MiniSearch full-text index:

- `search_docs(query)` — BM25 search across all indexed documentation
- `list_pages()` — returns route paths + page titles + links (sitemap)
- `get_page_details(route)` — full description.md content for a specific route
- `get_user_journey(query, actor?)` — searches documented step-by-step workflows

### Search index

Built at server startup from `import.meta.glob` modules. Documents are chunked by `##` heading (and by `###` for long sections). Index uses BM25 scoring, title boost 2x, fuzzy matching 0.2, prefix search. HMR-safe via `globalThis.__search_index`.

### Tool loop

Max 5 rounds. Each round: send messages to OpenAI → if tool_calls, execute locally and append results → repeat until text response. Final HTML is sanitized to strip fabricated links.

### Key modules

- `$lib/server/ai/search_index.ts` — MiniSearch index, chunking, search/lookup functions
- `$lib/server/ai/tools.ts` — tool definitions + executor factory
- `$lib/server/ai/stream_chat.ts` — OpenAI streaming with tool-calling loop
- `context.server.ts` — glob imports, index creation, slim system prompt

## Auth

None — public endpoint.

## Notes

- Response format: NDJSON with chunks `{ type: "text", content }`, `{ type: "done" }`, `{ type: "error", message }`
- `sanitize_links` strips any URL not in the valid routes set
- Webmaster routes (rates, pay) are excluded from the search index
