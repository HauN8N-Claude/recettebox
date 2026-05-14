# =============================================================================
# RecetteBox Worker — Image Docker
# =============================================================================
# Base : Node 20 LTS slim
# Inclus : ffmpeg (extraction audio + frames)
# =============================================================================

FROM node:22-slim AS builder

# ffmpeg + dépendances de compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps (cache layer)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Build TS → JS
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie deps + build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Worker n'expose pas de port HTTP (réveillé via Supabase Realtime).
# Mais on en expose un quand même pour healthcheck Railway.
ENV PORT=8080
EXPOSE 8080

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "process.exit(0)"

CMD ["node", "dist/index.js"]
