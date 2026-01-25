# =============================================================================
# Multi-stage Dockerfile for SvelteKit app
# Usage:
#   Development: docker build --target dev -t habita-dev .
#   Production:  docker build --target runtime -t habita .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage: deps - Install dependencies with bun
# -----------------------------------------------------------------------------
FROM oven/bun AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

# -----------------------------------------------------------------------------
# Stage: dev - Development target (expects volume-mounted source)
# -----------------------------------------------------------------------------
FROM oven/bun:1-debian AS dev

WORKDIR /app

RUN useradd -m -u 10001 appuser

COPY package.json bun.lock ./
COPY --from=deps /app/node_modules ./node_modules

RUN chown -R appuser:appuser /app

USER appuser

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# -----------------------------------------------------------------------------
# Stage: builder - Build the production bundle with Bun
# -----------------------------------------------------------------------------
FROM deps AS builder

ARG COMMIT_SHA
COPY . .
RUN bun run build

# -----------------------------------------------------------------------------
# Stage: runtime - Production target with Node.js runtime
# -----------------------------------------------------------------------------
FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN useradd -m -u 10001 appuser

# Copy bun binary (needed for migrations/seeds)
COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun

# Copy package files and production dependencies
COPY package.json bun.lock ./
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/build ./build

# Copy database migrations, seeds, config, and lib helpers
COPY --from=builder /app/db ./db
COPY --from=builder /app/kysely.config.ts ./
COPY --from=builder /app/src/lib ./src/lib

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "build"]
