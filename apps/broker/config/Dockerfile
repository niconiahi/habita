# =============================================================================
# Multi-stage Dockerfile for Broker consumers
# Usage:
#   Development: docker build --target dev -t broker-dev .
#   Production:  docker build --target production -t broker .
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

# -----------------------------------------------------------------------------
# Stage: production - Production target
# -----------------------------------------------------------------------------
FROM runtime AS production

WORKDIR /app

ENV NODE_ENV=production

RUN useradd -m -u 10001 appuser

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules

COPY src ./src
COPY db ./db
COPY tsconfig.json ./

RUN chown -R appuser:appuser /app

USER appuser
