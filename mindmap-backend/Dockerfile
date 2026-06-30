# ─── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first — leverages Docker layer caching
COPY package.json package-lock.json ./

# Install only production deps; skip devDependencies (nodemon, etc.)
RUN npm ci --omit=dev

# ─── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed production modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Drop .env so secrets are injected at runtime via AWS (ECS task definition /
# Parameter Store / Secrets Manager) — never bake secrets into the image
RUN rm -f .env

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose API port (matches PORT env var default)
EXPOSE 5000

# Health check — AWS ELB/ECS uses this to determine container health
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the Node server
CMD ["node", "server.js"]
