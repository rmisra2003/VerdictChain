# ⚖️ VerdictChain Backend

Welcome to the backend engine of **VerdictChain** — an enterprise-grade, AI-powered forensic investigation workspace. VerdictChain provides immutable audit trails, blockchain-anchored evidence integrity, automated timeline and relationship-graph generation, and comprehensive risk reports.

VerdictChain is designed for hackathon-winning aesthetics, rigorous architectural modularity, and production-grade stability.

---

## 🛠️ Technology Stack

* **Core Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
* **Database & ORM**: PostgreSQL via [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async/AsyncIO-driven)
* **Validation**: [Pydantic v2](https://docs.pydantic.dev/) for type-safe requests and responses
* **AI Processing**: DeepSeek AI (via `openai` Python SDK pointed at DeepSeek RPC)
* **Decentralized Storage**: [Walrus Protocol](https://walrus.xyz/) (Sui-backed Blob Store)
* **Blockchain Infrastructure**: Sui Blockchain via [Tatum RPC](https://tatum.io/) & [Tatum MCP](https://tatum.io/)
* **Security & Auth**: JWT-bearer tokens using `python-jose` and password hashing via `passlib[bcrypt]`

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── api/             # HTTP API Routers (Auth, Cases, Evidence, Timeline, Graph, Verification)
│   ├── core/            # Base configuration, async database engine, JWT security utils
│   ├── models/          # Declarative SQLAlchemy 2.0 models (User, CaseVault, Evidence, Proof, etc.)
│   ├── repositories/    # Async generic repository pattern layer for database queries
│   ├── schemas/         # Pydantic request and response validation schemas
│   ├── services/        # Service layer (DeepSeek AI, Walrus, Sui, Tatum RPC, Tatum MCP, Trust Score)
│   └── utils/           # Auxiliary helpers (MIME-validation, SHA256, secure filenames, audit logger)
├── requirements.txt     # Python package dependencies
├── .env                 # Environment configuration template
└── main.py              # Root execution script
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
Ensure you have the following installed:
* **Python 3.12** or higher
* **PostgreSQL** running locally or via Docker

### 2. Installation & Setup

Clone and navigate to the backend workspace:
```bash
cd backend
```

Create a virtual environment and activate it:
```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root of the `backend/` directory. You can copy the values below:

```ini
# Database Connection
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/verdictchain

# JWT Security
SECRET_KEY=verdictchain-hackathon-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Walrus Storage
WALRUS_STORAGE_PROVIDER=tatum
WALRUS_PUBLISHER_URL=
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-mainnet.walrus.space
WALRUS_EPOCHS=4

# Sui Blockchain Setup
SUI_NETWORK=devnet
SUI_SENDER_ADDRESS=0x0000000000000000000000000000000000000000000000000000000000000000
SUI_NOTARY_PACKAGE_ID=
SUI_NOTARY_MODULE=verdictchain_notary
SUI_NOTARY_FUNCTION=seal_evidence
SUI_CLI_ENABLED=true
SUI_CLI_PATH=sui
SUI_GAS_BUDGET=10000000

# Tatum Infrastructure Keys
TATUM_API_KEY=your-tatum-api-key
TATUM_API_URL=https://api.tatum.io
TATUM_RPC_URL=https://fullnode.devnet.sui.io:443
TATUM_MCP_URL=https://mcp.tatum.io

# DeepSeek AI Integration
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Server Launch Controls
HOST=0.0.0.0
PORT=8000
DEBUG=false
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
ENABLE_DEMO_BOOTSTRAP=false

# Security Rules
MAX_FILE_SIZE_MB=50
ALLOWED_MIME_TYPES=application/pdf,image/png,image/jpeg,video/mp4,audio/wav,audio/mpeg,text/plain,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

> 💡 **Hackathon Simulation Mode**: If `TATUM_API_KEY` or `DEEPSEEK_API_KEY` are left as placeholders, the services automatically fall back to high-fidelity, deterministic simulated responses, enabling zero-config demos.

### 4. Running the Server

Start the local server with hot reloading enabled:
```bash
python3 main.py
```

Or run via Uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running, the interactive Swagger docs will be available at:
* 🌐 **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* 🌐 **Redoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔒 Security Architecture

VerdictChain implements defense-in-depth protocols:
1. **Filename Sanitization**: Strip path traversal markers, control characters, and restrict length.
2. **Strict MIME Filtering**: File uploads must match white-listed MIME types.
3. **Double Integrity Verification**: File content hashes are computed on upload (SHA-256), matched against decentralized Walrus storage downloads, and validated on-chain (Sui transaction proofs).
4. **JWT Auth Guards**: JWT authentication with SHA-256 signatures ensures data is accessible only by authorized investigators.
5. **Immutable Audit Trails**: Actions such as `upload`, `verify`, `generate_report`, and `proof_creation` are logged with JSON metadata inside an immutable PostgreSQL audit ledger.

---

## 📖 Complete Documentation

Explore the following detailed markdown guides for in-depth information:
* 📘 [Architecture Guide](ARCHITECTURE.md) - Deep dive into systems, services, and background flows.
* 📘 [API Reference](API_REFERENCE.md) - Request/response structures for all endpoints.
* 📘 [Database Schema](DATABASE_SCHEMA.md) - Table layouts, indices, and relationships.
* 📘 [Deployment Manual](DEPLOYMENT.md) - Deploying via Docker, systemd, or cloud providers.
