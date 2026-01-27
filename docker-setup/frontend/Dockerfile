# Frontend Dockerfile - Production Mode with Nginx
# Build stage
FROM node:24.13-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY ../frontend/package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application files
COPY ../frontend/ .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:1.25-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy custom nginx config
COPY docker-setup/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
