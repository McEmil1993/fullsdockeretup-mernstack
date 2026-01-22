# Backend Dockerfile - Development Mode
FROM node:24.13-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY ../../backend/package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY ../../backend/ .

# Expose port
EXPOSE 3000

# Run development server
CMD ["npm", "run", "dev"]
