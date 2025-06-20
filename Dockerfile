FROM node:20.12.2-alpine

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++ py3-pip

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY web/package*.json ./web/

# Install dependencies
RUN cd server && npm ci
RUN cd web && npm ci

# Copy dev scripts first
COPY dev.sh ./
COPY docker-dev.sh ./

# Copy source code
COPY server ./server
COPY web ./web
COPY shared ./shared

# Install multiexec globally and netcat for database health check
RUN npm install -g multiexec && apk add --no-cache netcat-openbsd

# Make scripts executable
RUN chmod +x docker-dev.sh dev.sh

# Expose the application port
EXPOSE 4002

# Use the docker dev script by default
CMD ["sh", "docker-dev.sh"]