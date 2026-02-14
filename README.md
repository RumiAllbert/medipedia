# Medipedia

A trusted health encyclopedia where every article is AI-generated, citation-verified, and quality-scored by an independent council of judges.

## What It Does

Medipedia uses **Lumi**, an AI research engine, to generate comprehensive health articles grounded in real medical sources. Before anything gets published, a three-judge council evaluates each article for **evidence quality**, **medical safety**, and **clarity** -- producing a transparent trust score readers can inspect.

### Key Features

- **AI-generated articles** with real, verifiable citations from authoritative medical sources
- **Trust scoring** -- every article shows its council verdict, evidence breakdown, and citation quality
- **Knowledge graph** (Orbis) -- explore how health topics connect visually
- **Search & discovery** -- full-text search, tag filtering, and a command palette for quick navigation
- **Editorial workflow** -- articles go through draft, review, and approval stages before publication
- **Role-based access** -- readers, contributors, reviewers, and admins each have appropriate permissions

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, NextAuth, Google Gemini, D3.js, Vitest

## Getting Started

```bash
npm install
cp .env.example .env     # add your DATABASE_URL, AUTH_SECRET, and optionally GEMINI_API_KEY
docker compose up -d      # start PostgreSQL
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

This project is proprietary. All rights reserved.
