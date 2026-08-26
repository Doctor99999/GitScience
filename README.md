# GitScience™ — Sovereign Decentralized Science Notary

GitScience™ is a decentralized platform that cryptographically notarizes scientific
manuscripts as Prior Art, enforces a transparent economic consensus, and anchors
evidence to the Bitcoin blockchain via OpenTimestamps. The protocol is designed for
**research use only (RUO)** medical/scientific collaboration with a built-in
mathematical anti-plagiarism and revenue-fairness engine.

---

## Economic Consensus (55 / 15 / 30)

Every monetized interaction splits revenue in basis points (bps = 1/10000):

| Recipient            | Share  | bps  | Purpose                                  |
|----------------------|--------|------|------------------------------------------|
| **Author / Creator** | 55%    | 5500 | Direct authorship reward                 |
| **Infrastructure**   | 15%    | 1500 | Protocol infrastructure & storage pool   |
| **Founder**          | 30%    | 3000 | Protocol architect & long-term stewardship |

B2B transactions apply a **+20% Gross-Up** tax paid by the buyer (not deducted from the
author), so the 55/15/30 split is always computed on the *base* amount. This is the
canonical split and is enforced identically in `backend/gitscience_storage.py`,
`contracts/AmanatSplitter.sol`, and `genesis_protocol.c`.

---

## Architecture

```
backend/            FastAPI application — single source of truth for all protocol logic
  ├─ main.py                 REST API, JWT auth, HMAC webhooks, rate limiting
  ├─ gitscience_storage.py   SQLite (BEGIN IMMEDIATE) + Git OID anchoring, search
  ├─ gitscience_fortress.py  DualTimestampingNotary (RFC 3161 + LIVE OpenTimestamps)
  ├─ gitscience_compiler.py  SafeASTEvaluator (red-team hardened)
  ├─ gitscience_verifier.py  Plagiarism / integrity verification
  ├─ gitscience_rating.py    Scientist reputation (CDSS Class I)
  ├─ gitscience_privacy.py   Anonymization / RUO guards
  └─ tests/                  30 pytest suites (security, consensus, OTS, JWT)

frontend/           Next.js 16 PWA (KZ / RU / EN), mobile zero-overflow
contracts/          Solidity: AmanatSplitter v3.3 + SovereignIPNFT (Hardhat deploy)
nginx/              HTTPS-ready reverse proxy (TLS 1.2/1.3, HSTS, http2)
```

### Cryptographic evidence chain
1. Manuscript PDF → Git commit (real GitPython OID, SHA-1 fallback).
2. RFC 3161 trusted timestamp embedded.
3. OpenTimestamps **LIVE Bitcoin calendar** anchoring (env-gated
   `GITSCIENCE_OTS_LIVE=1`); otherwise simulated for CI.
4. Returned bundle carries `ots_status` + verifiable `.ots` file
   (`ots verify <file>.ots`).

---

## Security posture

- JWT with `jti`, revocation table, rotation (`/auth/refresh`, `/auth/logout`).
- ORCID-bound identities mitigate Sybil attacks on votes/reviews/court.
- HMAC-SHA256 signed fiat webhooks with timestamp anti-replay (300 s).
- `@ip` rate limiter honoring `X-Real-IP` behind proxy.
- AST evaluator forbids `**`, `kwargs`/`*args`, length > 2000, NaN/Inf.
- Integer-only cents/bps math; conservation tested.
- CI: `pip-audit` + `npm audit`; backend pytest; frontend build; Pages deploy.

> **Action required (owner):** the supply-chain secret `Metamask.txt` was purged
> from git history, but the exposed password **must still be rotated** externally.

---

## Local development

Prerequisites: Python 3.11+, Node 20+, Git.

```bash
# 1. Backend
python -m venv venv
venv\Scripts\activate        # Windows  (source venv/bin/activate on Linux/macOS)
pip install -r backend/requirements.txt
cp .env.example .env        # set JWT_SECRET, FIAT_WEBHOOK_SECRET
python server.py             # http://127.0.0.1:8000/docs

# 2. Frontend (separate terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev                  # http://localhost:3000
```

Or use the all-in-one launchers: `start.bat`, `start_backend.bat`, `start_frontend.bat`.

---

## Production deployment

### Render (recommended)
`render.yaml` defines two services — `gitscience-api` (FastAPI) and
`gitscience-frontend` (Next.js). Set `FIAT_WEBHOOK_SECRET` in the dashboard.

### Docker Compose
```bash
docker compose up --build
```
Exposes `:80` and `:443`. Mount real TLS certs (see commented volume block in
`docker-compose.yml`); without them nginx generates a self-signed cert for staging.

### Smart contracts
```bash
cd contracts
npm install
cp .env.example .env        # PRIVATE_KEY, RPC_URL, INFRASTRUCTURE_POOL
npm run deploy:polygon      # or :base / :sepolia / :localhost
```
Wire the printed addresses into `backend/PROTOCOL_CONSTANTS.json`
(`amanat_splitter_address`, `sovereign_ipnft_address`).

---

## Compliance & standards

- **Prior Art**: 35 U.S.C. §102, EPC Art. 54(2), WIPO Paris Convention.
- **Archival**: ISO 14721 OAIS.
- **Evidence**: RFC 3161 + OpenTimestamps.
- **Metadata**: Highwire Press / Schema.org.
- **Medical**: RUO / SaMD Class I — physician-in-the-loop, attestation required.

---

## Status

Code-complete and audit-hardened. Remaining owner actions:
1. Deploy `AmanatSplitter` / `SovereignIPNFT` to mainnet.
2. Rotate the previously-exposed MetaMask password.
3. Mount production TLS certificates.
