FROM mcr.microsoft.com/playwright:v1.52.0-noble
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY src ./src
ENV PORT=8082
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
EXPOSE 8082
CMD ["pnpm", "run", "start"]
