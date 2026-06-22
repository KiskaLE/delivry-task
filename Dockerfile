FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["pnpm", "start"]

FROM node:22-alpine AS migrator

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/.npmrc ./
COPY --from=deps /app/node_modules ./node_modules
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY docker/migrate.sh /migrate.sh

RUN chmod +x /migrate.sh

CMD ["/migrate.sh"]
