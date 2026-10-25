# ---- Build stage: compile the Angular app ----
FROM node:24 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npx ng build

# ---- Runtime stage: serve with nginx and proxy the API ----
FROM nginx:1.27-alpine

# Where nginx forwards /api and /socket.io (the compose service by default)
ENV BACKEND_UPSTREAM=http://backend:3000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/easyfit/browser /usr/share/nginx/html

EXPOSE 80
