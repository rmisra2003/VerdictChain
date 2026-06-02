# 🚢 VerdictChain Production Deployment Guide

This guide details the procedure for deploying the **VerdictChain Backend** into production environments.

---

## 🐋 Dockerized Deployment (Recommended)

Docker isolates the Python runtime and dependencies, making deployments predictable and easily scalable.

### 1. `Dockerfile`
The backend ships with `backend/Dockerfile`, pinned to Python 3.12 and Uvicorn.

---

### 2. `docker-compose.yml`
Define the backend application container along with a production-ready PostgreSQL instance:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: verdictchain-db
    restart: always
    environment:
      POSTGRES_DB: verdictchain
      POSTGRES_USER: verdictchain_admin
      POSTGRES_PASSWORD: StrongProductionPassword123!
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U verdictchain_admin -d verdictchain"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: verdictchain-backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://verdictchain_admin:StrongProductionPassword123!@db:5432/verdictchain
      - SECRET_KEY=generate-a-secure-64-character-hex-key-here
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=1440
      - ENABLE_DEMO_BOOTSTRAP=true
      - WALRUS_STORAGE_PROVIDER=tatum
      - WALRUS_PUBLISHER_URL=
      - WALRUS_AGGREGATOR_URL=https://aggregator.walrus-mainnet.walrus.space
      - WALRUS_EPOCHS=4
      - SUI_NETWORK=devnet
      - SUI_SENDER_ADDRESS=0x84978ca85b3effd9712157238aa262126392b782897917d7e8475376dcfcb7a2
      - SUI_NOTARY_PACKAGE_ID=0x5f8a69e8004ee5aa943dccaf5b0fa336dfffcf5b320aa13b081b772ecaf5b823
      - SUI_CLI_ENABLED=true
      - SUI_CLI_PATH=sui
      - SUI_GAS_BUDGET=10000000
      - TATUM_API_KEY=your-actual-production-tatum-key
      - TATUM_API_URL=https://api.tatum.io
      - TATUM_RPC_URL=https://fullnode.devnet.sui.io:443
      - TATUM_MCP_URL=https://mcp.tatum.io
      - DEEPSEEK_API_KEY=your-actual-production-deepseek-key
      - DEEPSEEK_BASE_URL=https://api.deepseek.com
      - DEEPSEEK_MODEL=deepseek-chat
      - HOST=0.0.0.0
      - PORT=8000
      - DEBUG=false
      - CORS_ORIGINS=["https://verdictchain.com", "https://api.verdictchain.com"]
      - MAX_FILE_SIZE_MB=50
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

Launch the entire stack:
```bash
docker-compose up -d --build
```

---

## 🛠️ Bare Metal Deployment (systemd + Nginx)

If deploying directly onto an Ubuntu/Debian server without Docker:

### 1. Configure systemd Service
Create `/etc/systemd/system/verdictchain.service`:

```ini
[Unit]
Description=VerdictChain FastAPI Backend Application
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/verdictchain/backend
ExecStart=/var/www/verdictchain/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
EnvironmentFile=/var/www/verdictchain/backend/.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable verdictchain
sudo systemctl start verdictchain
```

---

### 2. Configure Nginx Reverse Proxy
Install Nginx:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create `/etc/nginx/sites-available/api.verdictchain.com`:

```nginx
server {
    listen 80;
    server_name api.verdictchain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/api.verdictchain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 3. Setup SSL via Let's Encrypt
Obtain and configure SSL certificates automatically:
```bash
sudo certbot --nginx -d api.verdictchain.com
```

Certbot will automatically modify the Nginx configuration to force HTTPS redirection and secure communication.

---

## 📈 Monitoring & Reliability

1. **Log Rotation**: In bare-metal setups, configure `logrotate` to prevent `/var/log/syslog` from filling the disk. In Docker, specify max-size options in `daemon.json`:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```
2. **Ulimits**: Increase file descriptor limits (`ulimit -n 65535`) on high-traffic nodes to handle concurrent persistent HTTP connections.
3. **Database Backups**: Schedule a daily cron job to run `pg_dump` and sync encrypted SQL dumps to secure bucket storage (e.g. AWS S3).
