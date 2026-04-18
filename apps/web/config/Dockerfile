# =============================================================================
# Multi-stage Dockerfile for SvelteKit app
# Usage:
#   Development: docker build --target dev -t habita-dev .
#   Production:  docker build --target production -t habita .
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
# Stage: dev - Development target (expects volume-mounted source)
# -----------------------------------------------------------------------------
FROM runtime AS dev

WORKDIR /app

RUN useradd -m -u 10001 appuser

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules

RUN chown -R appuser:appuser /app

USER appuser

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# -----------------------------------------------------------------------------
# Stage: builder - Build the production bundle
# -----------------------------------------------------------------------------
FROM deps AS builder

ARG COMMIT_SHA
COPY . .
RUN pnpm exec svelte-kit sync && pnpm run build

# Pre-compile consumer and cron scripts to standalone JS (no tsx/tsconfig needed at runtime)
RUN pnpm exec esbuild \
  src/lib/server/broker/consumer/email.script.ts \
  src/lib/server/broker/consumer/subscription.script.ts \
  src/lib/server/broker/consumer/escalation.script.ts \
  src/lib/server/cron/create_escalation_jobs.script.ts \
  src/lib/server/cron/create_renewal_jobs.script.ts \
  --bundle --platform=node --format=esm --outdir=scripts \
  --external:pg --external:ioredis --external:kafkajs \
  --external:@opentelemetry/* \
  --alias:$lib=./src/lib --alias:db=./db

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
COPY --from=builder /app/scripts ./scripts

COPY --from=builder /app/db ./db
COPY --from=builder /app/kysely.config.ts ./

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "build"]
