FROM oven/bun AS builder

WORKDIR /apps/web

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:22 AS runtime

WORKDIR /apps/web

COPY package.json bun.lock ./
COPY --from=builder /apps/web/node_modules ./node_modules

COPY --from=builder /apps/web/build ./build
COPY --from=builder /apps/web/db ./db
COPY --from=builder /apps/web/app/lib ./app/lib
COPY --from=builder /apps/web/kysely.config.ts ./

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
