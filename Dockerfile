FROM node:22-alpine AS base

# Install pnpm via corepack (included with Node)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ---- Dependencies stage ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# ---- Build stage ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- Production stage ----
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Run as non-root user
USER node
CMD ["node", "dist/webMain.js"]