FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=/app/data/coastervault.db
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 ridetracker
COPY --from=builder --chown=ridetracker:nodejs /app/public ./public
COPY --from=builder --chown=ridetracker:nodejs /app/.next/standalone ./
COPY --from=builder --chown=ridetracker:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/data && chown ridetracker:nodejs /app/data
USER ridetracker
EXPOSE 3000
CMD ["node", "server.js"]
