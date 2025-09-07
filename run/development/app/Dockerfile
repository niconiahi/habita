FROM oven/bun AS runtime
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
RUN bunx playwright install
RUN bunx playwright install-deps
COPY . .
CMD ["bun", "run", "dev"]
