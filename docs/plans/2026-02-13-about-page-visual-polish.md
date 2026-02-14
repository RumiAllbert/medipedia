# About Page + Visual Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a bold, modern About/Mission page and upgrade visual polish across the app (trust scorecard, home hero, article cards, empty states, global glassmorphism).

**Architecture:** All work is pure frontend -- no new API routes or database changes. New Tailwind keyframe animations added to `tailwind.config.ts` and `globals.css`. The About page is a server component. The trust scorecard gauge is a client component (for SVG animation). All other changes are edits to existing files.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3, tailwindcss-animate, Lucide icons, shadcn/ui

---

### Task 1: Add Tailwind Animations and Glassmorphism Utilities

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Add custom keyframes and animation utilities to tailwind.config.ts**

In `tailwind.config.ts`, add inside `theme.extend`:

```ts
keyframes: {
  "pulse-slow": {
    "0%, 100%": { opacity: "0.4" },
    "50%": { opacity: "0.8" },
  },
  "float": {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-10px)" },
  },
  "score-fill": {
    "0%": { strokeDashoffset: "283" },
    "100%": { strokeDashoffset: "var(--score-offset)" },
  },
},
animation: {
  "pulse-slow": "pulse-slow 4s ease-in-out infinite",
  "float": "float 6s ease-in-out infinite",
  "score-fill": "score-fill 1.5s ease-out forwards",
},
```

**Step 2: Add glassmorphism utility class in globals.css**

Append to `globals.css` after the existing `@layer base` blocks:

```css
@layer components {
  .glass {
    @apply border border-white/10 bg-card/60 backdrop-blur-xl;
  }
  .glass-strong {
    @apply border border-white/15 bg-card/80 backdrop-blur-2xl shadow-lg;
  }
}
```

**Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add custom animations and glassmorphism utilities"
```

---

### Task 2: Create the About Page

**Files:**
- Create: `src/app/about/page.tsx`

**Step 1: Create the About page as a server component**

Create `src/app/about/page.tsx` with the full page content. The page has 5 sections:

1. **Hero** -- large heading "Health knowledge you can trust." with animated gradient background blobs
2. **The Problem** -- stat callouts on dark glowing cards
3. **How It Works** -- 3-step pipeline cards (Lumi generates, Council evaluates, Trust is earned)
4. **The Council** -- three judge cards (Clarity, Evidence, Safety) with verdict badge styling
5. **Built With** -- tech stack badges in a grid

```tsx
import { Metadata } from "next";
import {
  Sparkles,
  Scale,
  ShieldCheck,
  Eye,
  BookCheck,
  Heart,
  Zap,
  Database,
  Code2,
  Palette,
  Brain,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About | Medipedia",
  description: "How Medipedia builds trust in health knowledge through AI generation and council-based review.",
};

const stats = [
  { value: "3", label: "Independent judges per article" },
  { value: "A/B/C", label: "Citation source tiers" },
  { value: "24h", label: "Automatic re-review cycle" },
  { value: "100", label: "Maximum trust score" },
];

const steps = [
  {
    step: "01",
    icon: Sparkles,
    title: "Lumi Generates",
    description:
      "Our AI assistant classifies the topic, selects the right structure, and writes a fully cited, evidence-based article with grounded sources.",
    color: "text-teal-400",
    glow: "shadow-teal-500/20",
  },
  {
    step: "02",
    icon: Scale,
    title: "Council Evaluates",
    description:
      "Three independent judges -- Clarity, Evidence, and Safety -- score the article in parallel. Each returns a verdict, rationale, and cited sources.",
    color: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Trust Is Earned",
    description:
      "Scores are aggregated into an explainable trust scorecard. Articles must pass the source gate and meet score thresholds before publication.",
    color: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
];

const judges = [
  {
    name: "Clarity",
    icon: Eye,
    role: "Evaluates readability, structure, and whether the article is understandable to a general audience.",
    verdict: "PASS",
    color: "border-teal-500/30 bg-teal-500/5",
    badgeColor: "bg-teal-500/10 text-teal-500",
  },
  {
    name: "Evidence",
    icon: BookCheck,
    role: "Checks citation quality, factual accuracy, source tier compliance, and whether claims are properly grounded.",
    verdict: "WARN",
    color: "border-amber-500/30 bg-amber-500/5",
    badgeColor: "bg-amber-500/10 text-amber-500",
  },
  {
    name: "Safety",
    icon: Heart,
    role: "Identifies medical risks, missing disclaimers, dangerous advice, and ensures appropriate hedging language.",
    verdict: "PASS",
    color: "border-emerald-500/30 bg-emerald-500/5",
    badgeColor: "bg-emerald-500/10 text-emerald-500",
  },
];

const techStack = [
  { name: "Next.js 16", icon: Zap },
  { name: "React 19", icon: Code2 },
  { name: "TypeScript", icon: Code2 },
  { name: "Tailwind CSS", icon: Palette },
  { name: "Prisma + PostgreSQL", icon: Database },
  { name: "Google Gemini", icon: Brain },
  { name: "NextAuth.js", icon: Lock },
  { name: "D3.js", icon: Sparkles },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-10 shadow-sm md:p-16">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-teal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] animate-pulse-slow rounded-full bg-amber-500/10 blur-3xl [animation-delay:2s]" />

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-teal-500">
            About Medipedia
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.1] tracking-tight md:text-7xl">
            Health knowledge{" "}
            <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
              you can trust.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Medipedia is a safety-first health encyclopedia where every article is
            AI-generated with grounded sources, evaluated by a three-judge council,
            and continuously re-reviewed to stay accurate over time.
          </p>
        </div>
      </section>

      {/* ── The Problem ─────────────────────────────────── */}
      <section className="mt-16">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Why this matters
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Health misinformation is everywhere.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Most health content online lacks citations, transparency, or any mechanism
          for ongoing accuracy. Medipedia solves this with an explainable trust pipeline
          that never stops checking.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-strong rounded-2xl p-6 transition-shadow hover:shadow-xl"
            >
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────── */}
      <section className="mt-20">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          The pipeline
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          From topic to trusted article.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.step}
              className={`glass-strong group rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:${step.glow}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">
                  {step.step}
                </span>
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Council ─────────────────────────────────── */}
      <section className="mt-20">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Quality assurance
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Three judges. One verdict.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every article is evaluated independently by three specialized judges.
          Their scores are aggregated into a single trust score with full transparency
          into how each verdict was reached.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {judges.map((judge) => (
            <div
              key={judge.name}
              className={`rounded-2xl border p-8 transition-all hover:-translate-y-1 hover:shadow-lg ${judge.color}`}
            >
              <div className="flex items-center justify-between">
                <judge.icon className="h-6 w-6" />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${judge.badgeColor}`}
                >
                  {judge.verdict}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{judge.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {judge.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built With ──────────────────────────────────── */}
      <section className="mt-20 mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Technology
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Built with modern tools.
        </h2>

        <div className="mt-8 flex flex-wrap gap-3">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-card/80"
            >
              <tech.icon className="h-4 w-4 text-muted-foreground" />
              {tech.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add About page with mission narrative and council breakdown"
```

---

### Task 3: Add About Link to Sidebar and Mobile Nav

**Files:**
- Modify: `src/app/layout.tsx` (add About link to sidebar nav, after Orbis)
- Modify: `src/components/mobile-nav.tsx` (add About link to mobile nav, after Orbis)

**Step 1: Add About link to desktop sidebar**

In `src/app/layout.tsx`, add the `Info` import from lucide-react. Then add a new `<Link>` after the Orbis link in the sidebar `<nav>`:

```tsx
<Link
  href="/about"
  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
>
  <Info className="h-4 w-4" />
  About
</Link>
```

**Step 2: Add About link to mobile nav**

In `src/components/mobile-nav.tsx`, add `Info` to the lucide-react import. Then add a `<Link>` after the Orbis link:

```tsx
<Link
  href="/about"
  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
>
  <Info className="h-4 w-4" />
  About
</Link>
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/components/mobile-nav.tsx
git commit -m "feat: add About link to sidebar and mobile navigation"
```

---

### Task 4: Upgrade Trust Scorecard with SVG Gauge

**Files:**
- Modify: `src/components/trust-scorecard.tsx`

**Step 1: Rewrite trust-scorecard.tsx with radial SVG gauge and glassmorphism**

Replace the entire file. The new version includes:

- A circular SVG gauge (radius 45, circumference ~283) that visually fills based on the trust score
- Color transitions: emerald (85+), amber (70-84), red (<70)
- Glassmorphism card treatment
- Animated score bars with transition-all
- Review schedule info at the bottom

The `TrustScoreGauge` is a client component (needs `"use client"` for the CSS variable animation). The outer `TrustScorecard` can remain a server component that renders the gauge.

Create a new file `src/components/trust-score-gauge.tsx` for the client component:

```tsx
"use client";

function scoreColor(score: number) {
  if (score >= 85) return { stroke: "#10b981", text: "text-emerald-500" };
  if (score >= 70) return { stroke: "#f59e0b", text: "text-amber-500" };
  return { stroke: "#f87171", text: "text-red-400" };
}

export function TrustScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const { stroke, text } = scoreColor(score);

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-score-fill"
          style={{ "--score-offset": `${offset}` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${text}`}>{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Trust
        </span>
      </div>
    </div>
  );
}
```

Then update `src/components/trust-scorecard.tsx` to import and use the gauge, and apply glassmorphism:

Replace the Badge trust score display in CardHeader with the `<TrustScoreGauge score={trustScore} />` component. Wrap the Card in the `glass-strong` utility class. Keep the ScoreBar sub-component but add smooth transitions.

**Step 2: Commit**

```bash
git add src/components/trust-score-gauge.tsx src/components/trust-scorecard.tsx
git commit -m "feat: upgrade trust scorecard with SVG gauge and glassmorphism"
```

---

### Task 5: Refresh Home Page Hero

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update the hero section in page.tsx**

Replace the existing hero `<section>` (the first section inside the return) with a bolder version:

- Larger heading: `text-6xl` on desktop, `text-4xl` mobile
- Gradient text on the key phrase
- Animated gradient blobs (same pattern as About page)
- Live stats row showing article count from `result.totalCount`
- Keep the existing search form

The gradient background blobs use the same `animate-pulse-slow` class from Task 1. The heading uses `bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent` on the key phrase.

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: refresh home page hero with bold typography and animated gradients"
```

---

### Task 6: Add Hover Animations to Article Cards

**Files:**
- Modify: `src/components/article-card.tsx`

**Step 1: Enhance the Card component in article-card.tsx**

Update the Card className from:
```
h-full transition hover:-translate-y-0.5 hover:shadow-md
```
to:
```
h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5
```

Also add a subtle gradient border effect on hover by adding a wrapper or adjusting the card border. Add `glass` class to the Card for the frosted effect.

**Step 2: Commit**

```bash
git add src/components/article-card.tsx
git commit -m "feat: add enhanced hover animations to article cards"
```

---

### Task 7: Improve Empty States

**Files:**
- Modify: `src/app/page.tsx` (search no-results and empty article sections)
- Modify: `src/app/dashboard/page.tsx` (ArticleList empty state)

**Step 1: Enhance the empty state in the home page**

In `src/app/page.tsx`, update the empty state section (the `{result.items.length === 0 && (...)}` block). Replace the plain card with a more visually striking version:

- Larger icon (Sparkles or Search, 48px) with muted color
- Bolder heading
- Descriptive text
- Prominent CTA button with gradient styling

**Step 2: Enhance the dashboard empty state**

In `src/app/dashboard/page.tsx`, update the ArticleList empty state (the `if (articles.length === 0)` block). Add:

- A relevant Lucide icon (FileText for drafts, CheckCircle for published, Clock for reviews)
- More helpful text per category
- CTA button linking to the editor

**Step 3: Commit**

```bash
git add src/app/page.tsx src/app/dashboard/page.tsx
git commit -m "feat: improve empty states with icons and actionable CTAs"
```

---

### Task 8: Visual Verification

**Step 1: Run the dev server and verify all changes**

```bash
npm run dev
```

Visit these pages and verify visually:
- `http://localhost:3000` -- hero should have gradient blobs, bold text, animated background
- `http://localhost:3000/about` -- full narrative page with all 5 sections
- `http://localhost:3000/articles/<any-slug>` -- trust scorecard should show SVG gauge
- `http://localhost:3000/dashboard` -- empty states should show icons and CTAs
- Test dark mode toggle on each page

**Step 2: Run linter**

```bash
npm run lint
```

Fix any issues.

**Step 3: Run build to verify no TypeScript errors**

```bash
npm run build
```

Fix any issues.

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint and build issues from visual polish"
```
