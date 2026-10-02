# ---- Build stage: compile the Angular app ----
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .

# Angular 11's webpack needs the legacy OpenSSL provider on Node >= 17
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npx ng build --prod

# ---- Runtime stage: serve with nginx and proxy the API ----
FROM nginx:1.27-alpine

# Where nginx forwards /api and /socket.io (the compose service by default)
ENV BACKEND_UPSTREAM=http://backend:3000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/easyfit /usr/share/nginx/html

EXPOSE 80
