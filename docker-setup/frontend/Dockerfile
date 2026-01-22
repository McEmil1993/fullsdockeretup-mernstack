# Frontend Dockerfile - Development Mode
FROM node:24.13-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY ../../forntend/package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY ../../forntend/ .

# Expose port (Vite default port)
EXPOSE 5173

# Run development server with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host"]
