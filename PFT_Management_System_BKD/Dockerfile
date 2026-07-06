# Use official Node.js image with Alpine Linux for a lightweight footprint
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Production Stage
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Set Node environment to production
ENV NODE_ENV=production

# Copy package configurations
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JavaScript from builder stage
COPY --from=builder /usr/src/app/dist ./dist
# Copy raw source files if they are needed or if dependencies expect them, but typically only dist is needed.
# Since we have "type": "module" and start command runs node dist/app/index.js, we just need package.json and dist.

# Expose port (must match PORT in .env, default 8086)
EXPOSE 8086

# Start the application
CMD ["node", "dist/app/index.js"]
