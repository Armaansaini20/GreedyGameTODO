# -------------- STAGE 1: Builder --------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema before install (so postinstall can find it)
COPY prisma ./prisma

# Install deps
RUN npm ci

# Copy rest of app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# -------------- STAGE 2: Production --------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Expose Next.js port
EXPOSE 3000

# Run migrations before starting
CMD npx prisma migrate deploy && npm start
