# Stage 1: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY app/package.json app/bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY app/ .

# Copy data folder for prebuild script (generates benchmark-results.json)
COPY data ../data

RUN bun run build

# Stage 2: Production
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 app
RUN adduser --system --uid 1001 -G app app

COPY --from=builder --chown=app:app /app/.output ./.output
COPY --from=builder --chown=app:app /app/public ./public

USER app

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
