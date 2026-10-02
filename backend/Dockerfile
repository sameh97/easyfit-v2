# ---- Build stage: install deps (incl. native bcrypt) and compile TypeScript ----
FROM node:18-bookworm AS build

WORKDIR /app

# postinstall runs `tsc` + copies public/, so the sources must be present first
COPY . .

RUN npm ci && npm run build && npm prune --omit=dev

# ---- Runtime stage ----
FROM node:18-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

# multer writes temporary uploads to ./uploads
RUN mkdir -p uploads && chown node:node uploads

USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]
