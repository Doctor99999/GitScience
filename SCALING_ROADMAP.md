# GitScience Scaling Roadmap

> World-class architecture roadmap derived from a security/architecture audit, web research into comparable projects (DeSci Nodes/Codex, OpenTimestamps, Bernstein, Orvium, DecSci, Traxia), and a review of the current codebase state.
>
> Companion docs: `enterprise_audit.md` (what was already fixed), `production_rollout_plan.md` (deployment), `README_DEPLOY.md`.

## Core Architectural Rules (apply to all future work)

1. **Single source of truth** — every number rendered comes from the database or a real API. No hardcoded statistics, no `CWD`/drive-path assumptions, no mock data outside `ENVIRONMENT=development`.
2. **Async for the long, atomic for the short** — heavy/blocking work (notarization, PDF/watermark, DOI deposit, OTS batching, large imports) runs in Celery; CRUD mutations are atomic DB transactions; heavy reads are cached.
3. **Interface before technology** — everything external-facing is behind a thin interface so a component can be swapped without touching domain logic:
   - `BlobStore` (local CAS today → S3/R2 tomorrow)
   - `TimestampNotary` (OTS/Bitcoin today → lightning/ISO 3161 tomorrow)
   - `Ledger` (internal git today → public chain tomorrow)
   - `PidRegistry` (registration_code today → dPID-compatible resolver tomorrow)
   - `LicenseSettlement` (AmanatSplitter contract today → marketplace settlement tomorrow)
4. **API-first + OpenAPI** — versioned `/api/v1`, Pydantic outputs, no raw dict leaking to clients.
5. **Observability from day one** — structured JSON logs (request_id/trace), `/health` + `/ready`, Prometheus metrics, queue watch (Flower behind VPN).
6. **Idempotency everywhere** — every webhook (fiat/Stripe), every external mutation, keyed by `registration_code`/stable business key.

## What We Borrow From Reference Projects

| Project | Pattern | How We Apply It |
|---|---|---|
| DeSci Nodes / Codex | Version-invariant PID (dPID) + Merkle DAG; content-addressed storage; data vs application layer separation | `registration_code` = invariant PID; every manuscript version = new git commit + own OTS proof; `/pid/{code}` human-friendly resolver; `isBasedOn: "ipfs://..."` in JSON-LD after IPFS pinning |
| OpenTimestamps.org | Merkle aggregation + calendar servers; verify against Bitcoin headers with no third party | Batch pending hashes into a single `.ots` (Celery beat); verify via local headless-Bitcoin consensus; publish `/verify/{code}` live-check page |
| Bernstein / CryptSubmit | Defensive publishing: hash + Bitcoin proof of *disclosure date* = prior art for FTO | Anchor not just manuscripts but every review hash and every Court vote, exposing the "Date Lock" as a first-class marketing artifact |
| Orvium | Event-driven + CQRS + background job processing; decoupled blockchain module; DAJ governance; incentivized review | Public-ability events via outbox (notarize → event → index/stats/OTS queue); blockchain behind interface; review reputation as on-chain attestations |
| DecSci / Traxia | Immutable contribution log; cryptographic agent identity; reviewer reputation registry | We already have `review.hash`, Proof-of-Reputation, Quorum; formalize agent identity (`did:web`/WebAuthn for verified scholars) + public reviewer reputation metrics |
| Google Search Central | JSON-LD `@graph` with `@id`/`sameAs`/Wikidata; SHACL validation; server-rendered markup | Wrap existing server-side generator (`generate_schema_org_jsonld`) into `@graph` (Organization + Person + ScholarlyArticle + Dataset + ClaimReview for Court); SHACL-check in CI |

## Our Moat — Never Weaken These

1. **Sovereign Prior-Art** — legal framing (35 U.S.C. 102, EPC 54(2), WIPO) + Bitcoin-independent verification. This is the marketing core of the landing page.
2. **AmanatSplitter** — on-chain residual model for founders (30% base + 20% gross-up), consistent with the Python reference (CRediT-weighted 55/15/30). Monetization lever.
3. **Science Court** — Proof-of-Reputation, quorum, OAuth-verified jurors. Decentralized jurisdiction.
4. **ZK commit/reveal discovery**, full editorial pipeline (DOI/JATS/preregistration/RR/claims-graph), MaaS AST-sandboxed simulator, ledger-backed version history.

---

## Phase 0 — Landing & Public-Facing Readiness (1–2 weeks)

### Purpose
Make the platform presentable and trustworthy for a public landing, without architecture debt.

### Tasks
- **Kill fake data as source of truth**
  - `gitscience_storage.py` `get_platform_stats_summary` (hardcoded `+8420`, `+1250000`, `+128`, `42 nodes`, `total_reviews=12`) → real computed metrics API `/api/v1/platform/stats`.
  - Remove mock seed data (`CASE-2026-001`, 18-byte dummy PDF, fake MaaS charts) or gate strictly behind `ENVIRONMENT=development`.
- **Frontend publishing readiness**
  - `frontend/next.config.ts`: enable `output: "standalone"` in production builds.
  - Working `manifest.json` + icons (current PWA is broken), favicon, OG tags.
  - `sitemap.xml` / `robots.txt` (esp. for `output: "export"` layout); pre-render public catalog pages.
- **JSON-LD `@graph`**
  - `frontend/app/layout.tsx`: Organization + Person + per-manuscript ScholarlyArticle fed from `generate_schema_org_jsonld`.
  - ClaimReview for resolved Court cases; Dataset for the library.
  - SHACL validation step in CI.
- **Trust showcase pages**
  - `/verify/{code}` → live OTS verification via API (the HTTPS trust storefront).
  - `/pid/{code}` → PID resolver.
  - `/library` → "proof cards" (timestamps, ledger commits, review hashes).
- **Deploy hygiene**
  - DNS/HTTPS final; `ENVIRONMENT=production`; secrets only from env (remove docker-compose default passwords); CDN for static assets; CSP without `unsafe-inline`/`unsafe-eval`.

### Definition of Done
- Landing shows only real, API-sourced numbers.
- `verify`, `pid`, `library` pages live and resolve.
- Lighthouse SEO ≥ 90 on public pages; SHACL-valid JSON-LD.

---

## Phase 1 — Data Foundation (1–2 months)

### Purpose
Replace prototype storage with a foundation that survives concurrent users and data growth.

### Tasks
- **PostgreSQL + Alembic**
  - Migrate `gitscience.db` (SQLite) schema to PostgreSQL 16; stop creating schema at runtime.
- **JSON stores → SQL tables**
  - `peer_reviews.json`, `review_attestations.json`, `court_cases.json`, `zk_commitments.json`, `iot_*.json`, editorial stores → PG tables with transactions (currently: no write locking for any JSON store).
- **BlobStore abstraction**
  - Interface with implementations: local CAS (existing), S3/R2-compatible, all with SHA-256 integrity verification on read.
  - Remove `os.path.exists("F:\\")` heuristic in `gitscience_storage.py:24` → use only `GITSCIENCE_STORAGE_PATH`.
  - IoT: remove `Path.cwd()/storage` default (`gitscience_iot.py:38`) so duplicates on drive C: cannot reappear; wire both IoT + OTS + certificates through the storage abstraction.
- **Celery jobs (scaffold `gitscience_celery.py` exists)**
  - Notarization + watermark, OTS batch, DOI deposit, PDF/galley, arXiv/preprint import — idempotent by `registration_code`.
- **Webhook idempotency** — fiat/Stripe processing (`gitscience_fiat.py:88`) validates source + dedupes.

### Definition of Done
- Startup on fresh box = apply Alembic migrations + read config; no runtime schema bootstrap.
- All former JSON stores queryable/transactional; writes serialized.
- One env var (`GITSCIENCE_STORAGE_PATH`) controls every filesystem write.

---

## Phase 2 — Scale & Resiliency (2–3 months)

### Purpose
Handle real traffic without a "big-bang" rewrite; keep all features.

### Tasks
- **Async data layer** — `asyncpg` with bounded pools + `pool_pre_ping` on request hot paths.
- **Health/readiness** — `/health` (DB/Redis/BlobStore), `/ready` (warm pools).
- **Distributed rate limiting on Redis** (replace in-memory), Celery broker, catalog cache.
- **Observability** — structured JSON logs (request_id/trace id); Prometheus metrics (latency, errors, DB pool, queue depth); Flower behind VPN.
- **API hardening** — strict Pydantic responses everywhere (no raw dicts), OpenAPI gates for external consumers, rate/backoff on external calls (OpenAlex already queued).
- **Test coverage** — editorial/court/zk currently ~0; land unit + integration tests per module; keep `pytest` + `pip-audit` + `tsc --noEmit` in CI.
- **Security leftovers** — CSP tightening, non-root Docker images, image scanning, secrets via vault, strict CORS profiles.

### Definition of Done
- Load test (e.g. k6): 10× current expected traffic with p95 < 300ms for API reads.
- No lock contention on any store; no DB connection exhaustion under burst.

---

## Phase 3 — DeSci / Growth (3–6 months)

### Purpose
Compound as a decentralized-science player and open monetization channels.

### Tasks
- **PID/versions** — `/pid/{code}` + version DAG (dPID-compatible), **IPFS pinning service** (file → CID → pin → `isBasedOn` in JSON-LD). Removes single-host dependency; adds "decentralized resilience" landing narrative.
- **Real DOI deposit** — wire DataCite deposit via already-present `generate_datacite_metadata` (production account).
- **Preprint cross-posting** — arXiv/bioRxiv two-way bridge (`PreprintBridge`, `import_preprint` context exists).
- **Review reputation on-chain** — reviewer NFT attestations + public reviewer scores; Court votes each OTS-anchored.
- **MaaS Licensing Marketplace** — RUO license catalog for clinics, settlement via AmanatSplitter (55/15/30 + 20% gross-up). Primary monetization.
- **Open state feed** — machine/human-readable public event feed (ledger anchors, reviews, court rulings) mirroring DeSci Nodes openness.

### Definition of Done
- A manuscript can be: submitted → timestamped (OTS) → pinned (IPFS) → DOI-minted → cross-posted → licensed → settled on-chain — end to end.
- Public resolver works for anyone, no accounts required.

---

## Suggested First Move
Phase 0, item 1: honest `/api/v1/platform/stats` + JSON-LD `@graph` in the landing layout. Small, demoable, removes the credibility risk of fake numbers.