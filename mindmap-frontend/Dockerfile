# ─── Stage 1: Build the React app ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first — leverages Docker layer caching
COPY package.json package-lock.json ./

# Install all deps (including devDependencies needed for Vite build)
RUN npm ci

# Copy source files
COPY . .

# Build for production
# VITE_API_URL must be set at build time (it gets baked into the JS bundle)
# Pass it via --build-arg VITE_API_URL=https://your-api.example.com
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

RUN npm run build

# ─── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with our SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove the default nginx server block that conflicts
RUN rm -f /etc/nginx/sites-enabled/default 2>/dev/null; \
    nginx -t

EXPOSE 80

# Nginx runs in foreground in Docker
CMD ["nginx", "-g", "daemon off;"]
