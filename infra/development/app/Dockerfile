FROM oven/bun AS builder

WORKDIR /apps/web

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

# Use Playwright's official image - browsers and dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS runtime

WORKDIR /apps/web

# Tell Playwright where browsers are in this image
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create non-root user
RUN useradd -m -u 10001 appuser

COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
COPY --from=builder /apps/web/node_modules ./node_modules

# Change ownership to appuser
RUN chown -R appuser:appuser /apps/web

USER appuser

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
