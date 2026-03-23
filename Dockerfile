# --- Build Stage ---
FROM node:22-alpine AS build

WORKDIR /app

# Add ARGs for build-time configuration
ARG VITE_ADMIN_USER
ARG VITE_ADMIN_PASS

# Set ENVs from ARGs
ENV VITE_ADMIN_USER=$VITE_ADMIN_USER
ENV VITE_ADMIN_PASS=$VITE_ADMIN_PASS

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy project files
COPY . .

# Build the application
# Environment variables starting with VITE_ must be available during build time
RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
