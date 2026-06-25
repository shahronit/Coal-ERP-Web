# Firebase Cloud Functions

Deploy (requires Blaze plan):

```bash
cd firebase/functions && npm install
cd .. && firebase deploy --only functions
```

## Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `monthlyBackup` | 1st of month, 2am IST | Firestore export or POST to Cloud Run `/api/backup/run` |
| `keepAlive` | Every 3 days | Touch Firestore to avoid idle issues |
| `health` | HTTP | Health check |

## Environment (Firebase Functions config)

```bash
firebase functions:config:set tradecrm.api_url="https://coal-trading-app.web.app" \
  tradecrm.backup_token="your-cron-token"
```

Or set `TRADECRM_API_URL` and `BACKUP_GCS_BUCKET` in Cloud Functions environment.
