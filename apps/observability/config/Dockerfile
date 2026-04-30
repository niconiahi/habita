FROM node:22-slim AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM runtime AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM runtime AS dev
WORKDIR /app
RUN useradd -m -u 10001 appuser
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
RUN chown -R appuser:appuser /app
USER appuser
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5175"]

FROM deps AS builder
COPY . .
RUN pnpm exec svelte-kit sync && pnpm run build

FROM runtime AS production
WORKDIR /app
ENV NODE_ENV=production
RUN useradd -m -u 10001 appuser
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 3001
CMD ["node", "build"]
