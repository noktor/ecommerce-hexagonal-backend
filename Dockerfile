# Dockerfile for Node.js application
FROM node:18-alpine

# Install build tools necessary for bcrypt and other native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc* ./

# Install pnpm
RUN npm install -g pnpm

# Install all dependencies with pnpm
RUN pnpm install

# Build bcrypt manually after installation
# First approve builds and then rebuild bcrypt
RUN cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && \
    npm run install || \
    (cd /app && npm rebuild bcrypt --build-from-source) || \
    (cd /app && pnpm rebuild bcrypt)

# Copy source code
COPY src/ ./src/

# Build TypeScript for production
RUN pnpm run build

# Expose API port
EXPOSE 3000

# For production: run compiled JavaScript
# For development, override with: docker run ... pnpm run dev
CMD ["pnpm", "start"]

