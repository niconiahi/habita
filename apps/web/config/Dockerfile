FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && useradd -m -u 10001 appuser

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm exec svelte-kit sync && pnpm run build

FROM base AS dev
COPY --chown=appuser:appuser package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=appuser:appuser --from=deps /app/node_modules ./node_modules
USER appuser
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

FROM base AS production
ARG COMMIT_SHA
ENV NODE_ENV=production COMMIT_SHA=$COMMIT_SHA
COPY --chown=appuser:appuser package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=appuser:appuser --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appuser --from=builder /app/build ./build
COPY --chown=appuser:appuser --from=builder /app/instrument.mjs ./instrument.mjs
COPY --chown=appuser:appuser --from=builder /app/db ./db
COPY --chown=appuser:appuser --from=builder /app/kysely.config.ts ./
COPY --chown=appuser:appuser --from=builder /app/tsconfig.json ./
COPY --chown=appuser:appuser --from=builder /app/.svelte-kit/tsconfig.json ./.svelte-kit/tsconfig.json
COPY --chown=appuser:appuser --from=builder /app/src/lib ./src/lib
USER appuser
EXPOSE 3000
CMD ["node", "--import", "./instrument.mjs", "build"]
