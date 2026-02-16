# WebApp Dockerfile - Multi-stage build for production
# NOTE: Build context must be the workspace root (not ./milkly-webapp) to access milkly-backend/src/types
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
WORKDIR /workspace/milkly-webapp
# Copy mkly-editor for file: dependency resolution (package.json references file:../milkly-mklyml/mkly-editor)
COPY milkly-mklyml/mkly-editor/package.json ../milkly-mklyml/mkly-editor/package.json
COPY milkly-mklyml/mkly-editor/dist/ ../milkly-mklyml/mkly-editor/dist/
COPY milkly-webapp/package.json milkly-webapp/bun.lock* ./
RUN bun install --frozen-lockfile

# Build stage - use node for the build
FROM node:20-slim AS builder
WORKDIR /workspace/milkly-webapp
# Copy webapp source
COPY milkly-webapp/ .
# Copy backend types (shared dependency) - preserve the relative path structure
COPY milkly-backend/src/types.ts ../milkly-backend/src/types.ts
# Copy mkly-editor for file: dependency resolution
COPY milkly-mklyml/mkly-editor/package.json ../milkly-mklyml/mkly-editor/package.json
COPY milkly-mklyml/mkly-editor/dist/ ../milkly-mklyml/mkly-editor/dist/
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
# Copy node_modules from deps stage
COPY --from=deps /workspace/milkly-webapp/node_modules ./node_modules
# Create symlink so milkly-backend/src/types.ts resolves zod to the webapp's node_modules
# This ensures both use the same Zod instance
RUN mkdir -p /workspace/node_modules && ln -s /workspace/milkly-webapp/node_modules/zod /workspace/node_modules/zod
# Build
RUN npx vite build

# Production stage with nginx
FROM nginx:alpine AS runner
COPY --from=builder /workspace/milkly-webapp/dist /usr/share/nginx/html
COPY milkly-webapp/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
