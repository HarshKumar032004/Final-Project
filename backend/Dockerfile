# ==============================================================================
# BACKEND DOCKERFILE (Updated with Prisma Alpine Fix)
# ==============================================================================

FROM node:20-alpine AS builder

# 1. Fix for Prisma: Install OpenSSL & libc6-compat
RUN apk update && apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm install
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner

# 2. Fix for Prisma: Ensure OpenSSL is in the production container too
RUN apk update && apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

ENV NODE_ENV production

# 3. Optimization: Directly copy node_modules from builder. 
# This prevents any missing dependency or Prisma binary issues!
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

EXPOSE 8080

CMD ["node", "dist/server.js"]