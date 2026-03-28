# /chat

## Page (`+page.svelte`)
Client-side chat interface with streaming responses. Ephemeral — no persistence, resets on refresh.

## Endpoint (`+server.ts` — POST)
Receives `{ messages: [{ role, content }] }`, validates via `RequestSchema` (Valibot), and streams a Claude response back as `text/plain` chunked.

### Context loading (`context.server.ts`)
Uses `import.meta.glob` with `?raw` to eagerly load all DESCRIPTION.md files and user journey docs at build time. Composes them into a system prompt that gives Claude full platform knowledge.

### Streaming
Uses `client.messages.stream()` from `@anthropic-ai/sdk`. Iterates `content_block_delta` events and pipes `text_delta` values through a `ReadableStream`.

## Auth
None — public endpoint.

## Environment
- `ANTHROPIC_API_KEY` — required, loaded via `process.env`

## Key Components
Content (Root/Title), Button
