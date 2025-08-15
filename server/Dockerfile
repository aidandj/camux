# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source code
COPY server/ server/

# Install all dependencies (including dev for building)
RUN npm install

# Build the application
RUN npm run build --workspace=server

# Remove dev dependencies and clean cache
RUN npm ci --omit=dev && npm cache clean --force

# Expose the port
EXPOSE 6001

# Start the application
CMD ["npm", "start", "--workspace=server"]
