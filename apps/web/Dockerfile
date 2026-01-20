# =============================================================================
# Multi-stage Dockerfile for SvelteKit app
# Usage:
#   Development: docker build --target dev -t habita-dev .
#   Production:  docker build --target prod -t habita-prod .
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
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS dev

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN useradd -m -u 10001 appuser

COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
COPY --from=deps /app/node_modules ./node_modules

RUN chown -R appuser:appuser /app

USER appuser

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# -----------------------------------------------------------------------------
# Stage: build - Build the production bundle
# -----------------------------------------------------------------------------
FROM deps AS build

ARG COMMIT_SHA
# Using COMMIT_SHA busts cache when it changes - ensures fresh build per commit
RUN echo "Building commit: $COMMIT_SHA"
COPY . .
RUN bun run build

# -----------------------------------------------------------------------------
# Stage: prod - Production target with built app
# -----------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS prod

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

RUN useradd -m -u 10001 appuser

# Copy bun binary
COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun

# Copy package files and production dependencies
COPY package.json bun.lock ./
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/build ./build

# Copy database migrations and config (needed for kysely migrate)
COPY --from=build /app/db ./db
COPY --from=build /app/kysely.config.ts ./
COPY --from=build /app/src/lib/server/lazy.ts ./src/lib/server/lazy.ts

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "build"]
