# About Page + Visual Polish Design

**Date:** 2026-02-13
**Status:** Approved
**Visual tone:** Bold + modern (large typography, animated sections, dark-mode forward, glassmorphism)

---

## 1. About / Mission Page (`/about`)

Scrolling narrative page with 5 sections:

### Hero

- Full-width statement with large typography: "Health knowledge you can trust."
- Animated gradient background (teal -> amber, matching existing brand colors in globals.css)
- Subtle floating pulse or particle animation via CSS/Tailwind keyframes

### The Problem

- Short punchy section on why health misinformation matters
- Large stat callouts (e.g. "80% of health searches return unverified content")
- Dark card with glow effects (box-shadow with brand color)

### How It Works

Three-step visual pipeline:

1. **Lumi generates** -- AI writes grounded, cited articles
2. **Council evaluates** -- Three judges score independently
3. **Trust is earned** -- Explainable scorecard, continuous re-review

Each step as a card with Lucide icon and brief description. Staggered layout on desktop.

### The Council

- Visual breakdown of three judges: Clarity, Evidence, Safety
- Stylized "voting panel" visual with verdict badges (PASS/WARN/FAIL)
- Brief role description for each judge

### Tech / Open Source

- Tech stack badges (Next.js, React, Prisma, Gemini, PostgreSQL, etc.)
- One paragraph on architecture philosophy
- Link to GitHub if public

---

## 2. Trust Scorecard Visual Upgrade

**File:** `src/components/trust-scorecard.tsx`

- Circular/radial SVG gauge for aggregate trust score (0-100)
- Color-coded judge verdict pills with animated score bars
- Citation tier visualization (A/B/C as stacked color segments)
- Glassmorphism card treatment (backdrop-blur, translucent bg, subtle border)

---

## 3. Home Page Hero Refresh

**File:** `src/app/page.tsx`

- Larger, bolder typography (text-6xl on desktop)
- Animated gradient background matching the About page
- Floating "trust badge" element showing live article count + average trust score
- Tighter visual hierarchy between headline, description, and search

---

## 4. Empty States

- Illustrated empty states for: search results (home page), dashboard tabs, admin pages
- Each with a clear CTA (e.g. "Generate your first article with Lumi")
- Consistent visual style using Lucide icons + muted text + action button

---

## 5. Global Polish

- Glassmorphism card treatments on key surfaces (hero cards, scorecards)
- Subtle hover animations on article cards (scale + shadow lift via Tailwind transitions)
- Consistent gradient accent usage (teal-to-amber) across the app
- Enhanced dark mode contrast on glassmorphism surfaces

---

## Technical Constraints

- All animations via Tailwind CSS keyframes + `tailwindcss-animate` (already installed)
- No additional dependencies -- use existing Lucide icons, shadcn/ui components
- SVG for the trust score gauge (no charting library needed)
- Server components where possible; client components only for interactive elements
- Keep existing color variable system in globals.css
