# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users compete for the highest points score. Built with Spec Driven Design: specs live in `/spec`, implementation follows `spec-impl` methodology from the skills added via `npx skills@latest add Klerith/fernando-skills`.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss` PostCSS plugin; no `tailwind.config.js`
- **ESLint 9** flat config (`eslint.config.mjs`)
- Path alias: `@/*` → project root

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

No test runner is configured.

## Architecture

Uses the **App Router** (`app/` directory). All routes, layouts, and pages go there.

- `app/layout.tsx` — root HTML shell, Geist fonts, global metadata
- `app/globals.css` — Tailwind v4 import + CSS variables for light/dark theme

When adding routes, prefer Server Components by default; add `"use client"` only when interactivity or browser APIs are required.

## Next.js 16 Docs

Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Key areas:

- `01-app/01-getting-started/` — App Router fundamentals
- `01-app/01-getting-started/07-mutating-data.md` — Server Actions
- `01-app/01-getting-started/08-caching.md` — caching model (changed significantly)
- `01-app/03-api-reference/` — full API reference
