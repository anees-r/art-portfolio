# Production image for Coolify (or any Docker host).
# Builds Next.js in standalone mode: the final image holds only the compiled
# server and its runtime dependencies — no source, no dev tooling.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEZDEN_MEDIA_BASE configures next/image's allowed host at build time.
# Coolify passes environment variables as build args when "Build Variable" is ticked.
ARG NEZDEN_MEDIA_BASE=https://nezden.com/media
ARG SITE_URL
ARG NEXT_IMAGE_UNOPTIMIZED
ENV NEZDEN_MEDIA_BASE=$NEZDEN_MEDIA_BASE SITE_URL=$SITE_URL NEXT_IMAGE_UNOPTIMIZED=$NEXT_IMAGE_UNOPTIMIZED
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build never touches the database (all pages render on request).
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["node", "server.js"]
