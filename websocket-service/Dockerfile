FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose WebSocket port (different from backend and frontend)
EXPOSE 3001

# Start the WebSocket service
CMD ["npm", "start"]
