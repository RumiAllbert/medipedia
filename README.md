# Medipedia

**A safety-first health encyclopedia with AI-powered article generation, multi-judge council scoring, and continuous agent review.**

Medipedia combines grounded AI generation (Google Gemini) with a transparent trust-scoring pipeline. Every article is evaluated by a three-judge council, assigned an explainable trust score, and scheduled for periodic re-review -- so published content stays accurate over time.

---

## Features

### Content & Discovery

- Full-text search with tag filtering, sorting (newest / trust score / A-Z), and cursor-based pagination
- Interactive knowledge graph (**Orbis**) -- D3 force-simulation visualizing articles, tags, and relationships
- Keyboard command palette (`Ctrl+K` / `Cmd+K`) for instant search and navigation
- Auto-generated table of contents, related articles, and article-to-article linking
- Markdown rendering with GFM support and text-to-speech playback

### AI Generation

- **Lumi** -- topic-adaptive article generator with strict claim-to-citation output contracts
- Async generation queue with progress polling (`QUEUED` -> `RUNNING` -> `SUCCEEDED`)
- Automatic metadata enrichment: SEO fields, entity extraction, safety flags, reading level
- Prompt telemetry via `PromptRun` (template version, model, token usage, latency)
- Deterministic fallback content when Gemini is unavailable

### Trust & Quality

- **Council voting** -- three parallel judges (Clarity, Evidence, Safety) each return a score, verdict (`PASS` / `WARN` / `FAIL`), rationale, and strict safety/unsupported-claim signals
- **Source gate** -- domain tier policy (A / B / C) enforces minimum citation quality before publication
- **Trust scorecard + timeline** -- per-article breakdown showing aggregate score, judge verdicts, citation freshness, source tiers, and trust events
- **Review alerts** -- automatic alerts when trust scores change, surfaced in the admin dashboard
- **Claim traceability** -- claim cards map article assertions to supporting citations

### Roles & Workflow

- Four-tier RBAC: `READER` < `CONTRIBUTOR` < `REVIEWER` < `ADMIN`
- Article lifecycle: `DRAFT` -> `PENDING_REVIEW` -> `PUBLISHED` (or `REJECTED`)
- Revision history with version tracking
- Reviewer approval gate -- reviewers can approve, reject, or request changes with notes

### Background Agents

- Async job queue (`AgentJob`) for generation, council review, metadata enrichment, and related-graph rebuilds
- Batch processing with exponential backoff, max retries, and dead-letter queue
- Trigger via `POST /api/internal/agent/tick` (secret-protected)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 Server Components |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui (new-york style) |
| Database | PostgreSQL 16 + Prisma ORM 7 |
| Auth | NextAuth.js v5 (email magic links, JWT sessions) |
| AI | Google Gemini (`@google/genai`) |
| Visualization | D3.js (force simulation, drag, zoom) |
| Validation | Zod 4 |
| Testing | Vitest + V8 coverage |
| Notifications | Sonner toast |
| Theme | Dark/light mode via next-themes |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Docker** (or a running PostgreSQL 16 instance)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (default points to Docker) |
| `AUTH_SECRET` | Yes | Random secret for JWT signing (`openssl rand -base64 32`) |
| `GEMINI_API_KEY` | No | Google Gemini API key -- fallback content used if absent |
| `GEMINI_MODEL` | No | Model name (default: `gemini-3-pro-preview`) |
| `EMAIL_SERVER` | No | SMTP connection string for magic link emails |
| `EMAIL_FROM` | No | Sender address for auth emails |
| `AGENT_TICK_SECRET` | No | Shared secret for the agent tick endpoint |
| `FF_PROMPT_TRACEABILITY` | No | Enable prompt/model run traceability writes |
| `FF_TRUST_TIMELINE` | No | Enable trust timeline API/UI |
| `FF_REVIEW_RISK_QUEUE` | No | Enable risk-prioritized review queue |
| `FF_ADMIN_JOBS_CONSOLE` | No | Enable admin jobs console APIs/UI |
| `FF_ARTICLE_REPORTING` | No | Enable article issue reporting |

### 3. Start PostgreSQL

```bash
docker compose up -d
```

> If you're not using Docker, point `DATABASE_URL` to any reachable PostgreSQL instance.

### 4. Generate Prisma client and run migrations

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

For mega-rollout environments:

1. Apply Phase A migration first (`20260214201000_mega_rollout_phase_a`).
2. Run `npm run db:backfill-traceability`.
3. Apply Phase B constraints migration (`20260214224500_mega_rollout_phase_b_constraints`).

### 5. Seed demo data

```bash
npm run db:seed
```

To seed sample articles separately:

```bash
npm run db:seed-articles
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```text
medipedia/
├── prisma/
│   ├── schema.prisma          # Data models (User, Article, Council, Agent, etc.)
│   ├── migrations/            # SQL migrations
│   ├── seed.ts                # Base seed script
│   └── seed-articles.ts       # Sample article seed
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home -- search, tags, article grid
│   │   ├── articles/[slug]/   # Article detail + revision history
│   │   ├── topics/            # Tag directory and tag-filtered views
│   │   ├── orbis/             # Knowledge graph visualization
│   │   ├── signin/            # Email magic link auth
│   │   ├── dashboard/         # Contributor dashboard + editor + review
│   │   ├── admin/             # Admin: users, sources, alerts, stats
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── orbis/             # Knowledge graph components + hooks
│   │   ├── article-card.tsx   # Article preview card
│   │   ├── trust-scorecard.tsx# Trust score breakdown
│   │   ├── markdown-editor.tsx# Rich markdown editor
│   │   ├── command-search.tsx # Cmd+K command palette
│   │   └── ...                # Layout, nav, theme, breadcrumbs
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── auth/              # RBAC guard + role utilities
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── ai/                # Prompts, contracts, Gemini client
│   │   └── services/          # Business logic (articles, council, agents, AI)
│   └── types/                 # TypeScript declarations
├── supabase/                  # Supabase project + SQL migrations
├── docker-compose.yml         # PostgreSQL 16 Alpine
└── vitest.config.ts           # Test configuration
```

---

## API Reference

### Articles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/articles` | Public | List published articles (optional `?q=` search) |
| `POST` | `/api/articles` | Contributor+ | Create article draft |
| `GET` | `/api/articles/:slug` | Public | Get article (drafts visible to author only) |
| `PUT` | `/api/articles/:slug` | Author/Admin | Update article (creates revision) |
| `POST` | `/api/articles/:slug/submit` | Author | Submit draft for review |
| `GET` | `/api/articles/:slug/scorecard` | Public | Trust score breakdown + council details |
| `GET` | `/api/articles/:slug/timeline` | Public | Trust timeline events |
| `POST` | `/api/articles/:slug/report` | Public/Auth | Report issue for an article |
| `GET` | `/api/articles/:slug/related` | Public | Related article suggestions |
| `GET` | `/api/articles/:slug/revisions` | Public | Revision history |
| `GET` | `/api/articles/search?q=` | Public | Search articles |
| `GET` | `/api/articles/tags` | Public | Tag autocomplete |
| `GET` | `/api/articles/mine` | Authenticated | Current user's articles |
| `POST` | `/api/articles/generate-from-topic` | Reader+ | Queue AI article generation |

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reviews/:articleId/approve` | Reviewer+ | Approve article (validates council gate) |
| `POST` | `/api/reviews/:articleId/reject` | Reviewer+ | Reject article |
| `POST` | `/api/reviews/:articleId/request-changes` | Reviewer+ | Request revisions |
| `GET` | `/api/reviews/queue` | Reviewer+ | Risk-prioritized review queue |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/users` | Admin | List all users |
| `POST` | `/api/admin/users/:id/role` | Admin | Update user role |
| `POST` | `/api/admin/sources` | Admin | Add/update source domain policy |
| `GET` | `/api/admin/jobs` | Admin | List generation + agent jobs |
| `POST` | `/api/admin/jobs/:id/retry` | Admin | Retry generation/agent job |
| `POST` | `/api/admin/jobs/requeue-dead-letter` | Admin | Requeue dead-letter/failure jobs |

### Internal

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/internal/agent/tick` | Secret header | Process queued background jobs |
| `POST` | `/api/ai/enrich/:articleId` | Internal | Trigger metadata enrichment |
| `GET` | `/api/generation-jobs/:id` | Authenticated | Poll generation job status |
| `GET` | `/api/orbis` | Public | Knowledge graph data (nodes + edges) |

---

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm test                 # Run tests (vitest)
npm run test:watch       # Run tests in watch mode
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run db:seed          # Seed base data
npm run db:seed-articles # Seed sample articles
npm run db:backfill-traceability # Backfill claim/citation traceability + freshness cache
npm run agent:tick       # Trigger background agent processing
```

---

## Prompt Ops

- Prompt versioning guide: `/Users/rumiallbert/Downloads/scrap/medipedia/docs/prompt-versioning.md`
- Dead-letter recovery runbook: `/Users/rumiallbert/Downloads/scrap/medipedia/docs/runbooks/dead-letter-recovery.md`
- Council drift investigation runbook: `/Users/rumiallbert/Downloads/scrap/medipedia/docs/runbooks/council-drift-investigation.md`
- Prompt rollback runbook: `/Users/rumiallbert/Downloads/scrap/medipedia/docs/runbooks/prompt-rollback-by-version.md`

---

## Architecture Decisions

- **Discriminated union auth** -- `requireRole()` returns `{ ok: true, session } | { ok: false, response }` instead of throwing, enabling clean control flow in API routes.
- **Council-gated publishing** -- articles cannot be published unless the council evaluation passes the source gate and meets minimum score thresholds.
- **Job deduplication** -- council reviews are deduplicated by article ID to prevent redundant AI evaluations.
- **Edge-compatible Prisma** -- uses `@prisma/adapter-pg` with the `pg` driver for edge runtime compatibility.
- **In-memory rate limiting** -- token bucket per user/IP without external dependencies (suitable for single-instance deployments).
- **Graceful AI fallback** -- all AI-dependent features degrade deterministically when `GEMINI_API_KEY` is unset.

---

## Deployment

### Supabase (Database)

Local Supabase project files are in `/supabase` with SQL migrations matching the Prisma schema.

```bash
supabase login
supabase orgs list
supabase projects create medipedia-v1 --org-id <ORG_ID> --region us-east-1 --db-password <DB_PASSWORD>
supabase link --project-ref <PROJECT_REF>
supabase db push
```

### Vercel / Node.js

Set environment variables on your hosting platform, then:

```bash
npm run build
npm start
```

---

## License

This project is proprietary. All rights reserved.
