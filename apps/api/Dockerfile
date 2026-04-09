# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN npm install -g pnpm@9

WORKDIR /app

# Copy all workspace manifests first (for layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install all deps (including devDeps for build tools)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm --filter @da-apparels/database exec prisma generate

# Build the API
RUN pnpm --filter @da-apparels/api build

# ── Stage 2: production deploy bundle ──────────────────────────────────────────
FROM node:20-alpine AS deploy
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/types/src ./packages/types/src

# Copy Prisma schema (needed for migrate deploy at runtime)
COPY packages/database/prisma ./packages/database/prisma

# Use pnpm deploy to create a self-contained production bundle
# This resolves all workspace links and hoists everything correctly
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client in the production node_modules
RUN pnpm --filter @da-apparels/database exec prisma generate

# Copy compiled API output
COPY --from=build /app/apps/api/dist ./apps/api/dist

# ── Stage 3: minimal runner ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy the entire self-contained deploy bundle
COPY --from=deploy /app ./

# Run migrations then start
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema packages/database/prisma/schema.prisma && node apps/api/dist/main.js"]

EXPOSE 4000
