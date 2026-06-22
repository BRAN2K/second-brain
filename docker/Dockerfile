# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base
WORKDIR /app

# --- Production dependencies only ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- Build + quality gates (tests/typecheck run here) ---
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run typecheck && bun test

# --- Slim runtime image ---
FROM base AS release
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
# tsconfig.json is needed at runtime: Bun resolves the @/* path alias from it.
COPY --from=build /app/package.json /app/tsconfig.json ./
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+(Bun.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "src/index.ts"]
