# Use official Node.js image with Alpine Linux for a lightweight footprint
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package configurations
COPY package.json package-lock.json ./

# Install build dependencies required for compiling native modules like bcrypt
RUN apk add --no-cache python3 make g++

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm install --force

# Copy the rest of the application files
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Production Stage
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Set Node environment to production
ENV NODE_ENV=production
# Render automatically sets the PORT environment variable. We read it or default to 8086.
ENV PORT=8086

# Copy package configurations
COPY package.json package-lock.json ./

# Install build dependencies required for compiling native modules like bcrypt
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install --only=production --force \
    && apk del .build-deps

# Copy compiled JavaScript from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Use a non-root unprivileged user for security
USER node

# Expose port (Render ignores EXPOSE but it serves as good documentation)
EXPOSE 8086

# Start the application using node directly
CMD ["node", "dist/app/index.js"]
