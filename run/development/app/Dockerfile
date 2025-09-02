FROM oven/bun AS runtime
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run dev"]
