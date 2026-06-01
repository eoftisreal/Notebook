# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Stage 2: Install backend dependencies
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Stage 3: Final production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy backend dependencies
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Copy backend source
COPY backend/package*.json ./backend/
COPY backend/src ./backend/src

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/out ./frontend/out

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "start"]