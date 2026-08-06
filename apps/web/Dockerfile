FROM node:24-slim AS builder
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1
# the build evaluates the auth config; the real secret comes from compose at runtime
ENV BETTER_AUTH_SECRET=build-time-placeholder-secret-not-used-at-runtime

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

ENV NODE_ENV=production
RUN cd apps/web && bun run build
# standalone output excludes public/; ensure it exists so the runner copy never fails
RUN mkdir -p apps/web/public
# bundle the migration runner (drizzle + pg) for the deploy preDeployCommand
RUN bun build scripts/db-migrate.ts --target=node --format=esm --outfile=/app/db-migrate.mjs
RUN mkdir -p /app/migrations && cp -r packages/db/src/migrations/. /app/migrations/

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/db-migrate.mjs ./db-migrate.mjs
COPY --from=builder /app/migrations ./migrations

ENV HOSTNAME=0.0.0.0
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/web/server.js"]
