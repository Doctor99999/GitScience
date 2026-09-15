# GitScience™ — Полный анализ проекта

> **Версия документа:** 1.0  
> **Дата:** 15.09.2026  
> **Статус:** Факты + Оценка + Бэклог P0/P1/P2  
> **Компаньоны:** `docs/BUSINESS_MODEL.md` (монетизация), `SCALING_ROADMAP.md` (архитектурная дорожная карта), `enterprise_audit.md` (исправленный аудит), `production_rollout_plan.md` (деплой)

---

## 1. Резюме

**GitScience™ — код-полный, аудит-харденный морально, но не завершённый стратегически.**

Проект вышел из прототипной стадии: работает криптографический нотариат с цепочкой доказательств (Git OID → RFC 3161 → OpenTimestamps/Bitcoin), исполняемая математика в песочнице (Safe AST/MaaS), полный журнальный editorial-процесс (рецензия, DOI, JATS, пререгистрация, версии), мировой индекс открытой науки (OpenAlex FTS5/BM25) для проверки prior-art, B2B-фиат-инвойс с консенсусом Аманата 55/15/30 (+20% gross-up), трёхъязычный UI (KZ/RU/EN).

**Главный риск — не технический, а продуктово-финансовый:** у проекта нет подтверждённой платящей выручки. Код содержит два работающих монетизационных актива (prior-art отчёт по мировому индексу и B2B-инвойс), но они не проверены на рынке. Критика «такие проекты живут только на грантах» имеет ядро истины — но относится к грантовому слою *инфраструктуры*, а не к слою *верификации*, где существует документально подтверждённая воля платить (см. разделы 7–9).

**Следующий шаг (вне кода):** 5–10 интервью с платёжеспособными сегментами (патентные бюро, TTO, фарма, клиники) + консьерж-пилот первой платящей единицы. В коде для этого менять почти ничего не нужно.

---

## 2. Продукт и миссия

Миссия: защитить авторский приоритет учёных, сделать науку исполняемой и справедливо вознаграждаемой.

Функционально продукт делится на **два слоя**, которые нельзя смешивать при стратегическом планировании:

| Слой | Что это | Финансовая природа |
|---|---|---|
| **A — Суверенная инфраструктура** | Открытый реестр приоритета, нотариат (Git OID + RFC 3161 + OTS/Bitcoin), Science Court, ZK-Discovery, SBT-паспорта, open library | Миссия и моат. Живёт на грантах/донорах по определению (как arXiv, Crossref, Zenodo, OpenAlex). Кассой не является. |
| **B — Верификация и аналитика** | Verified Prior-Art Report по мировому индексу, B2B-фиат-инвойс с консенсусом 55/15/30, юр-контекст, аудит | Продукт с рыночной ценой. Вот здесь рождается выручка. |

Ошибка критиков «это грантовый проект» — в переносе природы слоя A на весь продукт. Слой B живёт по рыночным законам (см. раздел 8).

---

## 3. Архитектура

### 3.1. Backend (FastAPI) — ~11 000 строк / 24 файла

| Модуль | Размер | Назначение |
|---|---|---|
| `main.py` | 199 | Точка входа: env, rate limiter, trusted-proxy, CORS, middleware, `include_router` ×4 |
| `routes/platform.py` | ~740 | Routing: notary, billing, DataCite XML, fiat invoice, wallet, prior-art, compiler, AI audit, IPNFT, statistics, warehouse ping |
| `routes/identity.py` | ~155 | Routing: Science Court (dispute/vote), peer review (submit/list/reputation/claim/attestation), auth/login/verify/refresh/logout, OAuth callback, scholar register |
| `routes/research.py` | ~205 | Routing: ZK-Discovery (commit/reveal/list), IoT gateway, Vampire protocol, World Science Index (search/prior-art/status/harvest) |
| `routes/editorial.py` | ~743 | Routing: register-user, submit, assign-editor, find-reviewers, assign-reviewers, submit-review, decision, DOI mint, JATS export, letter, post-pub comment, plagiarism check, preprint import, revision workflow, version history, checklist, analytics, pipeline, dashboard, claims, transfers, preregistration, amend |
| `routes/deps.py` | ~220 | Shared singletons (engines, DOI/JATS services), `_app_is_production()` dynamic getter, Bearer JWT helpers, `require_active_bearer`, `require_verified_orcid` (Sybil protection), `require_editor_role` |
| `gitscience_editorial.py` | 2631 | Полный журнальный workflow: рецензия, DOI/JATS, версии, задачи, пререгистрация, claims-graph, перенос между журналами, email |
| `gitscience_storage.py` | 861 | SQLite/Postgres (BEGIN IMMEDIATE/WAL), Git OID-анкор, CAS-волат, FTS5 prior-art, DataCite |
| `gitscience_vampire.py` | 670 | Импорт открытой науки (OpenAlex/arXiv/PubMed), лицензионная фильтрация |
| `gitscience_fortress.py` | 560 | DualTimestampingNotary (OTS+RFC3161), ScienceCourt, CRediT (14 ролей), роялти-роутер |
| `gitscience_indexer.py` | 446 | **Phase I prior-art**: World Science Index (OpenAlex FTS5/BM25) — новый, не в git |
| `gitscience_compiler.py` | 274 | SafeASTEvaluator — песочница для формул |
| `gitscience_review.py` / `auth.py` / `certificate.py` | 253 / 243 / 222 | Слепое рецензирование, ORCID OAuth 2.0 + JWT, PDF-сертификаты WIPO |
| `invoice_pdf.py` / `iot.py` / `ai_review.py` / `web3.py` | 207 / 195 / 184 / 164 | B2B PDF-счёт, HSM-шлюз IoT, AI-аудитор, Web3 RPC |
| `fhir.py` / `zk.py` / `fiat.py` / `passport.py` | 156 / 135 / 112 / 106 | Клинический HL7 FHIR, ZK-коммиты, B2B-фиат, SBT-паспорт |
| `ipnft.py` / `importer.py` / `celery.py` | 87 / 73 / 69 | IP-NFT метаданные, arXiv-импорт, Celery-задачи |
| `gitscience_data/editorial/rate_limiter.json` | — | Персистентный state ритм-лимитера |

### 3.2. Frontend (Next.js 16.3.4 / React 19 / Tailwind v4)

- 13 вкладок: Notary, Inspector, Library, ZK-Discovery, Passport, Peer-Review, MaaS, Amanat, Court, Vampire, Editorial, Dashboard, Preregistration.
- 3 языка (KZ/RU/EN): `frontend/lib/translations.ts` (1315 строк), **паритет ключей проверяется компилятором** (`_KeysEqual`, `_kzKeysParity`/`_enKeysParity`).
- PWA (SW, manifest), Web3 через Wagmi/ConnectKit, ORCID OAuth-форма (модалка), токен **не** хранится в localStorage (только React-состояние).

### 3.3. Контракты и генезис

- `AmanatSplitter.sol` (293 ст.): 55/15/30 bps, tax-escrow (48h timelock), pull-паттерновые выплаты, nonReentrant, SafeERC20.
- `SovereignIPNFT.sol` (251 ст.): ERC-721 + EIP-2981, запрет минтинга/трансфера на адрес контракта.
- `genesis_protocol.c` (58 ст.): C-эталон консенсуса (55/15/30).

**Консенсус 55/15/30 закодирован идемпотентно трижды** (Python `gitscience_fortress.py`, Solidity `AmanatSplitter.sol`, C `genesis_protocol.c`) — целостность экономики подтверждена на всех уровнях.

---

## 4. Состояние кода

### 4.1. Сильные стороны

- **Безопасность выше среднего для раннего проекта:**
  - JWT с `jti`, persistent-черный список отзыва, ротация через refresh; в production `auth_method=orcid_oauth` обязателен для Court/Review.
  - HMAC-SHA256 вебхуки с anti-replay окном 300 сек.
  - Rate limiter с явным CIDR-allowlist прокси (анти-спуфинг `X-Real-IP`).
  - AST-песочница: запрет eval/exec/kwargs, глубина ≤32, длина ≤2000, `safe_exp`/`safe_gamma`, ThreadPool c таймаутом 0.5s.
  - Path-traversal guard для PDF; magic-byte проверка `%PDF-`; размер ≤50 МБ.
  - Fail-fast настройки в production (JWT_SECRET, IOT_DEVICE_SECRET без значений → отказ).
- **Целостность консенсуса**: 55/15/30 + 20% gross-up — три реализации, тесты на сохранение суммы.
- **Честные fallback-ответы**: при пустом индексе prior-art явно возвращается `HEURISTIC_FALLBACK` с disclaimer, а не выдуманные «совпадения»; IP-NFT отказывается минтить без задеплоенного контракта.
- **i18n-паритет на уровне типов** — новые ключи нельзя добавить в один язык без двух других.
- **Полнота editorial-процесса** (2631 стр.): редко встречающийся для DeSci-прототипа уровень — DOI, JATS, пререгистрация, claims-graph, cross-journal transfer, revision-management.

### 4.2. Слабые стороны и хаки

| Проблема | Где | Влияние |
|---|---|---|
| **Монолит `main.py` (2523 строки)** | ~~Основные маршруты + вся editorial-группа (строки 1861–2523)~~ ✅ **Закрыто (коммит `7caf356`)** | `main.py` → 199 строк; логика вынесена в `routes/{deps,platform,identity,research,editorial}.py`. 108 OpenAPI-путей идентичны монолиту, 55/55 тестов прошли ДО добавления новых тестов |
| **Захардкоженная личность основателя** | `main.py:1111` (`if "3929" in orcid`) | Логика «если мой ORCID — показать институт» зашита в API вместо данных |
| **Fallback `F:\`** | `gitscience_storage.py:24` и `gitscience_iot.py:38` | Зависимость от существования диска на машине разработчика; задокументирована в SCALING_ROADMAP как Tech-Debt |
| **5 JSON-хранилищ без write-lock** | reviews, court, zk, iot, editorial | Риск потери данных при конкурентной записи / мультиворкерах gunicorn |
| **Незакоммиченная работа** | `gitscience_indexer.py` (untracked), харденинг (storage/main/celery/tests), локализация (translations/13 вкладок), infra (docker/nginx/render) | 81 коммит на ветке `main`, но чистый слой подготовки к запуску не в git |
| **Мок-данные в статистике** | `gitscience_storage.get_platform_stats_summary` | Задокументировано в SCALING_ROADMAP (Phase 0) — риск недоверия лендинга |

---

## 5. Данные и хранилище

- **Основной реестр**: SQLite WAL (`BEGIN IMMEDIATE`), путь из `GITSCIENCE_STORAGE_PATH` (+ Postgres URL-нормализация, schema runtime).
- **Vault**: Content-Addressable Storage по SHA-256 (2-byte sharding), стандарт ISO 14721 OAIS.
- **Anchoring**: каждый манускрипт = Git commit (реальный GitPython OID, SHA-1 fallback) + RFC 3161 + `.ots` (OpenTimestamps, LIVE по env `GITSCIENCE_OTS_LIVE=1`).
- **Поиск**: FTS5 в основной БД + отдельный FTS5-каталог `gitscience_indexer` (OpenAlex), BM25 с boost заголовка.
- **Риски**: (1) JSON-файловые хранилища многописательские; (2) эвристика `F:\`; (3) `rate_limiter.json` растёт без внутренней ротации (TTL-экспирация есть, но на диске до 50-го запроса).

---

## 6. Тестирование

| Артефакт | Размер | Покрытие |
|---|---|---|
| `tests/test_api.py` | 780 строк | ~67 запросов к ~40 эндпоинтам: health, compiler, auth (login/verify/refresh/logout/callback), ZK, нотариат, DataCite XML, fiat-инвойс + webhook (secret/stale/HMAC), billing, court/vote, review (submit/list/reputation/claim/attestation), certificate PDF, wallet balance, vampire import, prior-art (+status/edge) |
| `tests/test_editorial.py` | 285 | **NEW**: полный editorial-цикл (register → submit → assign-editor → find/assign-reviewers → submit-review → decision → DOI mint → JATS export → analytics dashboard) + RBAC-негативы (anon, Sybil ORCID-mismatch, не-редактор на editor-эндпоинтах, invalid role → 422) |
| `tests/test_court.py` | 176 | **NEW**: RBAC-негативы (vote/dispute без JWT → 401, Sybil-mismatch → 403), edge-case кворума (abstain-голоса, invalid-большинство → CONFIRMED, дубль голоса → ERROR, невалидный vote → 422, неизвестное дело) |
| `tests/test_zk.py` | 240 | **NEW**: happy-path commit→reveal, non-author reveal → 403, wrong salt/payload → verified=False, commit без JWT → 401, unit-тесты движка на tmp_path (детерминизм hash, персистентность) |
| `tests/test_compiler.py` | 89 | Red-team AST (инъекции, переполнение, DoS) |
| `tests/test_iot.py` | 109 | Ed25519-гатевей |
| `tests/conftest.py` | NEW | Autouse-сброс персистентного rate limiter (иначе 120 req/60s исчерпывается в тестовом процессе) |

**Кол-во тестов:** 91 (было 55; рефакторинг `main.py` прошёл с 55/55 без правок тестов, затем добавлены 36 новых).

**Дыры:** ~~editorial workflow (register/submit/decision/DOI/JATS/revision/claims), court-кейсы, ZK-границы, негативные кейсы редакторских RBAC — практически без тестов.~~ ✅ **Закрыто**: editorial happy-path + RBAC, court edge-кейсы и ZK-границы покрыты в `test_editorial.py`/`test_court.py`/`test_zk.py` (36 тестов).

**Прочее**: CI (`pip-audit` + `npm audit` + pytest + next build), Hardhat-тесты контрактов (typechain).

---

## 7. Экономический слой (готовность к выручке)

Консенсус Аманата (источник истины — `README.md`, три реализации):

```
 Входящий B2B-платеж:  X
 B2B Tax Gross-Up:    +20% (заказчик) → итоговый инвойс 1.2·X
 Распределение X:     55% авторы (CRediT 14 ролей)
                      15% инфраструктура/рецензенты
                      30% казначейство основателя
```

**Работающие платные потоки в коде (уже задеплоены функционально):**

1. **Verified Prior-Art Report** — `/api/v1/prior-art`: BM25 по мировому индексу OpenAlex (Phase I), Статус индекса `/api/v1/prior-art/status`. Ядро будущего B2B-продукта. Disclaimer честный (не патентная экспертиза).
2. **B2B-фиат-инвойс** — `/api/v1/billing/fiat/invoice` + PDF + HMAC-вебхук + консенсус 55/15/30 — готовый контур «выставили счёт → получили оплату → распределили».

**Кто платит сегодня за аналог** (источники 2026, раздел 8): от $199 (AI-поиск) до $1–3k (поиск+заключение, AIPLA median ≈ $2k) и $13.8k–244k/год (enterprise-подписки).

---

## 8. Конкурентный контекст

| Игрок | Модель | Цена | Урок для нас |
|---|---|---|---|
| Clarivate (Derwent/WoS) | enterprise-подписка | ≈$13.8k (SMB)–244k/год | Не конкурент на входе; подтверждает рынок |
| Orbit Intelligence (Questel) | enterprise-аналитика | подписка по запросу, сотни $k/год | То же |
| Google Patents / PQAI / The Lens | free-tier поиск | $0 | Free — без верифицируемого «сертификата» и юр-контекста |
| Patentia (AI) | авто-поиск | ≈$199/поиск | Задаёт нижнюю границу тарифа автоматизации |
| Патентные фирмы / независимые поисковики | pay-per-report | $150–1,500 (поиск) / $1,000–5,000 (поиск+заключение) | **Наш прямой сегмент**: они и есть клиенты слоя B |

Позиционирование: не «Clarivate-убийца», а **B2B pay-per-report** для патентных фирм/TTO/фармы на уже готовом индексе. Тарифная лестница: $199 авто / $999 верифицированный / $2,500 с юр-контекстом — детально в `docs/BUSINESS_MODEL.md`.

---

## 9. Грантовый разбор (ответ на критику «живут только на грантах»)

- **Слой A** (открытый нотариат/реестр/архив) — действительно грантовый и должен остаться бесплатным. Это норма: arXiv, Crossref, Zenodo, OpenAlex построены так же. Попытка монетизировать его = утрата доверия и миссии.
- **Слой B** (верификация/аналитика/юр-контекст) — рыночный. Воля платить документально подтверждена: ~70% отказов USPTO вызваны prior-art, который уже был в открытом доступе; отчёт в $1–2k спасает от $7–15k на подачу и $6–12k на prosecution.
- **Вывод документа:** критика справедлива для инфраструктурного слоя, но ошибочна для слоя верификации. Два готовых платных актива уже в коде (раздел 7). Гранты остаются подпиткой слоя A (моат/бренд), а не основным доходом.
- **Разделение ролей**: «двигать науку» = слой A; «чтобы двигать науку, нужна выручка» = слой B. Без выручки умрёт и слой A.

---

## 10. Риски

| Риск | Уровень | Митигация |
|---|---|---|
| **Юридический**: prior-art отчёт ≠ патентная экспертиза | Средний | Disclaimer уже в индексоре; продукт `$2.5k` с юр-контекстом — через атторнея, а не авто-заключение |
| **Продуктовый**: никто не платит за отчёт | Средний | Kill-criteria: 60 дней / 5–10 интервью / ≥2 платящих пилота; иначе дёшево пивотимся |
| **Инфраструктурный**: Celery/Redis-зависимость в prod | Средний | Фолбэк на локальное выполнение уже есть в коде; Celery — P1, не блокер запуска |
| **Финансовый/операционный**: консенсус и gross-up требуют юр. оформления инвойсов в юрисдикциях | Средний | KZ/CIS-блок в BUSINESS_MODEL.md (тенге, ставки патентных бюро) |
| **Технический долг**: JSON-хранилища, `F:\`, мок-статистика | Низкий-средний | P0–P1 бэклог ниже |

---

## 11. Бэклог (P0 / P1 / P2)

### P0 — немедленно (этот спринт)

- [x] Закоммитить незакоммиченную работу: `gitscience_indexer.py`, харденинг (storage/main/celery/tests), локализация (translations + 13 вкладок), infra (docker/nginx/render). Проверить, что `.env`/секреты не попали в git. → ✅ Коммиты `e0387ef` (prior-art + hardening), `b210600` (i18n 13 табов + OrcidModal)
- [x] Разбить `main.py` на `APIRouter`: роуты editorial вынести в `routes/editorial.py`, остальные сгруппировать по подсистемам. → ✅ Коммит `7caf356` (199 строк vs 2523; 108 OpenAPI-путей идентичны)
- [x] Убрать мок-данные из `get_platform_stats_summary` → реальные агрегаты из БД. → ✅ Рефакторинг `7caf356` + `gitscience_storage.py:770`: живая агрегация (manuscripts/ledger/disputes/OTS-files/BDB-счётчики), неотслеживаемые метрики не выдаются. Dev-мок ORCID в `gitscience_auth.py:79` гейтится через `IS_PRODUCTION`.
- [x] Убрать хардкод личности основателя из `main.py` → перенести в данные/константы. → ✅ `PROTOCOL_CONSTANTS.json` + `get_founder_identity()` (`gitscience_storage.py:200`); `main.py` не содержит имени/ORCID/wallet.
- [x] Frontend: финальная проверка `npm run lint` + `next build`. → ✅ 15.09.2026: eslint 0 ошибок, `next build` успешен (9 статических страниц, TypeScript чист). Локализация закоммичена в `b210600`.
- [ ] **Продуктовая упаковка слоя B** (по `ROADMAP_FORECAST.md` Этап 1): PDF-пакет prior-art-отчёта (подпись/печать для Verified), JSON-LD-экспорт для юристов, страница тарифов ($199/999/2500 и 190k/950k/2.4M ₸), онлайн-оплата → самозапуск первого пилота.

### P1 — ближайшие 1–2 месяца

- [ ] PostgreSQL 16 + Alembic (миграции вместо runtime-схемы; остановить `Schema will be overwritten`).
- [ ] JSON-хранилища (reviews/court/zk/iot/editorial) → таблицы SQL с транзакциями и write-сериализацией.
- [ ] Celery: нотариат+watermark, OTS-батчинг, DOI-заявки, PDF/galley, arXiv-импорт — идемпотентность по `registration_code`.
- [ ] Идемпотентность вебхуков fiat/Stripe (дедуп по ключу).
- [ ] Тесты editorial/court/zk (unit + integration), негативные RBAC-кейсы. → ✅ Закрыто ранее P0: `test_editorial.py`/`test_court.py`/`test_zk.py` (36 тестов, 91 всего)
- [ ] Убрать эвристику `F:\` — только `GITSCIENCE_STORAGE_PATH`; IoT через хранилище-абстракцию (BlobStore).

### P2 — 3–6 месяцев (рост/DeSci)

- [ ] JSON-LD `@graph` (Organization/Person/ScholarlyArticle/ClaimReview) + SHACL в CI; `/verify/{code}` live-OTS страница; `/pid/{code}`-резолвер.
- [ ] Деплой контрактов `AmanatSplitter` + `SovereignIPNFT` в mainnet (Polygon/Base), PRIVATE_KEY в env, адреса в `PROTOCOL_CONSTANTS.json`.
- [ ] IPFS-пиннинг (файл → CID → pin → `isBasedOn` в JSON-LD).
- [ ] On-chain аттестации рецензентов + OTS-анкор голосов Court.
- [ ] **MaaS Licensing Marketplace** (RUO-каталог для клиник, расчёт через AmanatSplitter) — первичная монетизация по SCALING_ROADMAP Phase 3.
- [ ] Ключ ротации секрета после purge `Metamask.txt` (README.md, Action required).
- [ ] **Публичный «реестр выплат авторам»** (витрина отчислений Amanat 55/15/30) — доверие, маркетинг, связка миссии с выручкой (по `ROADMAP_FORECAST.md` Этап 3).

---

## 12. Прогноз развития (стратегия)

Стратегия «карусель» (A+B+C) и дорожная карта с горизонтами 0–18 месяцев — в
**`docs/ROADMAP_FORECAST.md`** (v1.0, 15.09.2026). Квинтэссенция:

- **Трек A (бесплатно, навсегда)**: World Science Index, реестр приоритета, нотариат — моат, доверие, лидогенерация. Финансируется грантами/донорами и 30% казначейства Amanat.
- **Трек B (деньги сейчас)**: Verified Prior-Art Report ($199/999/2500; ₸ 190k/950k/2.4M) + B2B-инвойс. Целевой первый доход за 60 дней; конверсия депозитов из A.
- **Трек C (деньги на масштаб)**: MaaS Licensing Marketplace для клиник (B2B-лицензия от 7M ₸/год) — рекуррентная enterprise-выручка и крупные 55%-отчисления авторам.

**Решающая развилка (60 дней):** 5–10 интервью · ≥2 платящих пилота · ≥10 проданных
отчётов. Феррари-сценарий (~25%): 5–15 отчётов/мес + 1–3 клиники через год. Базовый
(~50%): 2–5 отчётов/мес + грантовый контур. Пессимистичный (~25%): дёшево пивотимся
в слой A, B/C заморожены до валидации.

---

## 13. Заключение и рекомендация

Проект технически готов к проверке рынка: цепочка нотариата полная, экономика целостная (три реализации консенсуса), безопасность выше уровней типичного прототипа, prior-art-индекс — реальный (не эвристика), B2B-инвойс работает. Реальный следующий шаг — **вне кода**: подтвердить готовность платить через интервью и консьерж-пилот (5–10 интервью → 1 платёжная единица → 2–3 платных пилота за 60 дней), и параллельно закрыть P0-бэклог (чистка монолита, честные метрики, коммит текущей работы).

Критика «грантовый проект» — для слоя инфраструктуры; слой верификации имеет рыночную цену и готовые активы в коде. Осталась рыночная проверка, а не код.