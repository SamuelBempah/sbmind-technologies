# Use Node.js 22 (matches your local version)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production  # Install production deps only

# Copy source code
COPY . .

# Expose port (Fly uses $PORT env var)
EXPOSE $PORT

# Health check endpoint (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/api/health || exit 1

# Start server
CMD ["npm", "run", "start"]  # Uses your "start" script