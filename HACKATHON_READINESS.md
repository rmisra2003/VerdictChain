# Hackathon Readiness Checklist

VerdictChain is now prepared for a Tatum x Walrus hackathon deployment path.

## Required Services

- Tatum API key for Walrus storage plus a funded Sui devnet CLI address.
- Tatum Walrus storage API access.
- DeepSeek API key.
- PostgreSQL database for the FastAPI backend.
- Frontend host such as Vercel.
- Backend host such as Render, Railway, Fly, or a Docker host.

## Backend Deployment

Deploy from `backend/` using `backend/Dockerfile` or a Python 3.12 runtime.

Required environment:

```ini
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...
WALRUS_STORAGE_PROVIDER=tatum
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-mainnet.walrus.space
SUI_NETWORK=devnet
SUI_NOTARY_PACKAGE_ID=0x5f8a69e8004ee5aa943dccaf5b0fa336dfffcf5b320aa13b081b772ecaf5b823
SUI_CLI_ENABLED=true
TATUM_API_KEY=...
TATUM_API_URL=https://api.tatum.io
TATUM_RPC_URL=https://sui-devnet.gateway.tatum.io
DEEPSEEK_API_KEY=...
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

After backend deploy:

```bash
curl https://your-backend-domain.com/health
```

Expected response includes:

```json
{"status":"healthy","service":"verdictchain-backend"}
```

## Frontend Deployment

Deploy the repository root as the Next.js app.

Required environment:

```ini
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

## Demo Flow

1. Open `/auth` and create or sign into an email account.
2. Open `/dashboard/cases` and create a case vault.
3. Open `/dashboard/upload`.
4. Upload a supported file.
5. Confirm the receipt shows:
   - SHA-256 hash
   - Walrus blob or pending blob id
   - Tatum Walrus job id
   - Refreshable Tatum Walrus job status
   - devnet Sui transaction status
6. Open `/verify`.
7. Upload the same file and verify the SHA-256 fingerprint through the backend.
8. Open the created case workspace and generate the DeepSeek timeline/report/graph artifacts.

## Video Script

1. Problem: digital evidence is easy to tamper with and hard to prove in court.
2. Register/login and create a real case vault.
3. Upload an evidence file.
4. Show the backend-backed Walrus/Tatum receipt.
5. Verify the same file publicly.
6. Generate AI report/timeline/graph as the forensic workspace layer powered by DeepSeek.
7. Close with the stack: Next.js, FastAPI, PostgreSQL, Sui devnet notary, Tatum Walrus storage, DeepSeek.

## Known Limits

- Current local sealing uses the deployed Sui devnet notary package through the local Sui CLI signer.
- Alembic is installed but migrations are not scaffolded yet; the backend currently creates tables at startup for local velocity.
