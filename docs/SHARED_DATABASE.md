# Shared database deployment (zero cost)

One PostgreSQL database on an office server PC. All users connect to the same API — entries from any location go into one database.

## Architecture

```
Staff PC (browser or Electron client)
        │
        ▼  Tailscale / LAN
Office server PC
  ├── Node backend (port 4000)
  ├── PostgreSQL (port 5432, local only)
  └── uploads/ folder
```

Do **not** expose PostgreSQL to the public internet. Only the Node API should be reachable (via Tailscale or LAN).

## 1. Office server PC setup

### Install PostgreSQL with Docker (free)

From the repo root:

```bash
docker compose up -d postgres
```

Default connection:

```
postgresql://tradecrm:tradecrm@127.0.0.1:5432/tradecrm
```

### Configure backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

- Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (`openssl rand -hex 48`)
- Set `HOST=0.0.0.0` so LAN/Tailscale clients can reach the API
- Set `FRONTEND_URL` and optional `CORS_ALLOWED_ORIGINS` for your Tailscale IP

### Run migrations and start

```bash
npm run start:server
```

Open `http://127.0.0.1:4000` on the server to complete setup.

## 2. Tailscale (free remote access)

1. Install [Tailscale](https://tailscale.com) on the server PC and each staff PC (free for up to 100 devices).
2. Note the server’s Tailscale IP (e.g. `100.64.0.10`).
3. Staff open: `http://100.64.0.10:4000`

Optional: allow that origin in `CORS_ALLOWED_ORIGINS` in `.env`.

## 3. Client options

### Browser (simplest)

Open the server URL in Chrome/Edge on any PC on Tailscale or LAN.

### Electron thin client

In `~/Library/Application Support/coal-trading-erp/settings.json` (macOS):

```json
{
  "deployMode": "client",
  "remoteApiUrl": "http://100.64.0.10:4000"
}
```

Or set environment variable before launch:

```bash
TRADECRM_MODE=client TRADECRM_REMOTE_API_URL=http://100.64.0.10:4000 npm run start:desktop
```

## 4. Migrate from legacy SQLite desktop

If you have an existing `tradecrm.db` from the old single-desktop app:

```bash
docker compose up -d postgres
cd backend && npm run db:migrate

SQLITE_PATH="$HOME/Library/Application Support/coal-trading-erp/data/tradecrm.db" \
DATABASE_URL=postgresql://tradecrm:tradecrm@127.0.0.1:5432/tradecrm \
npm run migrate:sqlite-to-postgres
```

Copy the `uploads/` folder from the old `userData` directory to the server `UPLOAD_DIR`.

## 5. Verification checklist

After migration or fresh setup, confirm in the app:

- [ ] Login works for all users
- [ ] Masters (suppliers, customers, qualities) match expected counts
- [ ] Purchase and sale lists load with correct totals
- [ ] Inventory / FIFO stock matches physical stock
- [ ] Payments and outstanding balances correct
- [ ] P&L and GST reports run without errors
- [ ] Document uploads open from server (not missing files)
- [ ] Two users can edit different records at the same time without errors
- [ ] Backup runs from Settings (creates `.zip` with `tradecrm.dump`)

## 6. Daily operations

| Task | How |
|------|-----|
| Backup | Settings → Back up now, or monthly auto-backup |
| Updates | `git pull`, `npm run db:migrate`, restart Node (pm2 recommended) |
| Monitor | Check Docker: `docker compose ps` |

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Connection refused` from remote PC | Check Tailscale on both machines; confirm `HOST=0.0.0.0` |
| CORS error in browser | Add client URL to `CORS_ALLOWED_ORIGINS` |
| `pg_dump: command not found` | Install PostgreSQL client tools on server |
| Migration fails | Ensure `docker compose up -d postgres` and `npm run db:migrate` ran first |
