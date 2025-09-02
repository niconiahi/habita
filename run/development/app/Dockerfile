FROM oven/bun AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .

RUN apt-get update && apt-get install -y curl

ENV SERVERDEV=true
EXPOSE 5173

CMD ["bun", "run", "dev"]
