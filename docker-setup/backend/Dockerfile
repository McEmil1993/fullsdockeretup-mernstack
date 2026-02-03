# Backend Dockerfile - Production Mode
FROM node:24.13-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY ../backend/package*.json ./

# Install dependencies (including devDependencies for build if needed)
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:24.13-alpine

# Install dumb-init for proper signal handling and Docker CLI for monitoring
RUN apk add --no-cache dumb-init docker-cli

# Create app user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Add nodejs user to docker group for Docker socket access
# Get the GID of the docker socket from host and create matching group
RUN addgroup -g 989 -S docker && adduser nodejs docker

# Set working directory
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs ../backend/ .

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads /app/public/uploads/chunks && \
    chown -R nodejs:nodejs /app/public

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/auth/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run production server
CMD ["node", "server.js"]
