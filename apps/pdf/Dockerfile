# Use Playwright image with pre-installed browsers
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# Install Bun (requires unzip)
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY src ./src

# Set environment
ENV PORT=8082
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 8082

CMD ["bun", "run", "start"]
