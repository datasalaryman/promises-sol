# syntax=docker.io/docker/dockerfile:1

FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY . .


RUN bun install --production

ENV NODE_ENV=production
RUN bun run build

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN chmod -R 777 .config/solana/id.json

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "start"]