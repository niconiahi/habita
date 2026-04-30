# =============================================================================
# Multi-stage Dockerfile for Observability UI (SvelteKit)
# Usage:
#   Production: docker build --target production -t habita-observability .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage: runtime - Base image with Node.js + pnpm
# -----------------------------------------------------------------------------
FROM node:22-slim AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate

# -----------------------------------------------------------------------------
# Stage: deps - Install dependencies with pnpm
# -----------------------------------------------------------------------------
FROM runtime AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage: builder - Build the production bundle
# -----------------------------------------------------------------------------
FROM deps AS builder

COPY . .
RUN pnpm exec svelte-kit sync && pnpm run build

# -----------------------------------------------------------------------------
# Stage: production - Production target with Node.js runtime
# -----------------------------------------------------------------------------
FROM runtime AS production

WORKDIR /app

ENV NODE_ENV=production

RUN useradd -m -u 10001 appuser

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/build ./build

COPY --from=builder /app/db ./db
COPY --from=builder /app/kysely.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/.svelte-kit/tsconfig.json ./.svelte-kit/tsconfig.json
COPY --from=builder /app/src/lib ./src/lib

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3001

CMD ["node", "build"]
