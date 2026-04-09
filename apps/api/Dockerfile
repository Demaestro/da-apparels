# ── Stage 1: install + build ────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install everything (dev + prod) so prisma CLI is available
RUN pnpm install --frozen-lockfile

# Copy all source
COPY . .

# Generate Prisma client, then build API
RUN pnpm --filter @da-apparels/database exec prisma generate
RUN pnpm --filter @da-apparels/api build

# Prune to production-only deps while keeping Prisma-generated files
RUN pnpm prune --prod

# ── Stage 2: minimal runner ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy everything (node_modules already pruned to prod-only in build stage)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/packages/database/package.json ./packages/database/
COPY --from=build /app/packages/types/src ./packages/types/src
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY package.json pnpm-workspace.yaml ./

# Run migrations then start
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema packages/database/prisma/schema.prisma && node apps/api/dist/main.js"]

EXPOSE 4000
