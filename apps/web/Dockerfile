FROM oven/bun AS builder

WORKDIR /apps/web

COPY package.json bun.lock ./
RUN bun install
RUN bunx playwright install
RUN bunx playwright install-deps

FROM node:22 AS runtime

WORKDIR /apps/web

COPY package.json bun.lock ./
COPY --from=builder /apps/web/node_modules ./node_modules

CMD ["npm", "run", "dev"]
