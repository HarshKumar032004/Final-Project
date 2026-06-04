# ==============================================================================
# BACKEND DOCKERFILE
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci
RUN npx prisma generate

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files and generated Prisma client
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

EXPOSE 8080

# Command to run (ensure Prisma schema is synced/migrated via CI/CD, here we just start)
CMD ["node", "dist/server.js"]
