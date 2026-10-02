# EasyFit V2 Monorepo

Gym management app: Angular frontend (`frontend/`), Express + Sequelize backend (`backend/`), PostgreSQL.

## Run with Docker

```bash
cp .env.example .env    # then fill in real values
docker compose up -d --build
```

Open http://localhost (or the port set in `WEB_PORT`). Log in with `Admin@easyfit.com` and your `ADMIN_PASSWORD`.

| Service    | What it does                                                        | Exposed      |
|------------|---------------------------------------------------------------------|--------------|
| `frontend` | nginx serving the Angular build; proxies `/api` and `/socket.io` to the backend | `WEB_PORT` (80) |
| `backend`  | Express API on port 3000                                             | internal only |
| `db`       | PostgreSQL 16, data kept in the `pgdata` volume                      | internal only |

Useful commands:

```bash
docker compose logs -f backend       # follow API logs
docker compose up -d --build         # redeploy after pulling changes
docker compose down                  # stop (data is kept)
```

## Deploying to a server

1. Install Docker, clone the repo, create `.env` from `.env.example` with strong `DB_PASS`, `TOKEN_SECRET` and `ADMIN_PASSWORD`.
2. `docker compose up -d --build`
3. Put HTTPS in front of port 80, e.g. a reverse proxy such as Caddy/Traefik, or a cloud load balancer.

The frontend calls the API on its own origin, so the same image works on any domain without rebuilding.

## Local development (without Docker)

- Backend: `cd backend && npm install && npm start` (reads `.env` from `backend/`, or export the variables).
- Frontend: `cd frontend && npm install --legacy-peer-deps`, then with `NODE_OPTIONS=--openssl-legacy-provider` and `TAILWIND_MODE=watch` set, `npm start` → http://localhost:4200 (API at `http://localhost:3000`, see `src/environments/environment.ts`).
