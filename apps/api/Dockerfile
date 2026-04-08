# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile --ignore-scripts
# Ensure optional node_modules dirs exist so COPY --from never fails
RUN mkdir -p packages/database/node_modules packages/types/node_modules

# ── Stage 2: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN npm install -g pnpm@9

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules

COPY . .

# Generate Prisma client
RUN pnpm --filter @da-apparels/database exec prisma generate

# Build the API
RUN pnpm --filter @da-apparels/api build

# ── Stage 3: production image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace manifests for pnpm deploy
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Production-only install (no devDeps)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy compiled output
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema and generated client
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy types package source (workspace dep)
COPY packages/types/src ./packages/types/src
COPY packages/types/package.json ./packages/types/

# Run migrations then start
CMD ["sh", "-c", "pnpm --filter @da-apparels/database exec prisma migrate deploy && node apps/api/dist/main.js"]

EXPOSE 4000
