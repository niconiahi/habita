FROM oven/bun AS builder

WORKDIR /apps/web

COPY package.json bun.lock ./
RUN bun install
# Install Playwright browsers in the builder stage
RUN bunx playwright install chromium

FROM node:22 AS runtime

WORKDIR /apps/web

# Install only the system dependencies needed to run chromium
RUN apt-get update && \
    apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
COPY --from=builder /apps/web/node_modules ./node_modules
# Copy the Playwright browsers from builder
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
