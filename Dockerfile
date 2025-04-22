# syntax=docker.io/docker/dockerfile:1

FROM oven/bun:1 AS base

WORKDIR /app

# Set locale environment variables
ENV LANG=C.UTF-8
ENV LANGUAGE=C.UTF-8
ENV LC_ALL=C.UTF-8

ARG DATABASE_URL
ARG REDIS_URL
ARG RPC_URL
ARG NEXT_PUBLIC_CLIENTVAR

ENV DATABASE_URL=${DATABASE_URL}
ENV REDIS_URL=${REDIS_URL}
ENV RPC_URL=${RPC_URL}
ENV NEXT_PUBLIC_CLIENTVAR=${NEXT_PUBLIC_CLIENTVAR}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install dependencies based on the preferred package manager
COPY package.json \
  tsconfig.json \
  components.json \
  drizzle.config.ts \
  mdx-components.tsx \
  next.config.js \
  postcss.config.js \
  tailwind.config.ts \
  /app/

RUN bun install

COPY --chown=nextjs:nodejs public/ /app/public/
COPY --chown=nextjs:nodejs src/ /app/src/
COPY --chown=nextjs:nodejs tests/ /app/tests/

RUN bun run build

# RUN chmod -R 777 .config/solana/id.json

RUN chown -R nextjs:nodejs /app/
RUN chmod -R a+rx /app/.next/

USER nextjs

EXPOSE 3000

ENV PORT=3000