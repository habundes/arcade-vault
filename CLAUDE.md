# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users compete for the highest points score. Built with Spec Driven Design: specs live in `/spec`, implementation follows `spec-impl` methodology from the skills added via `npx skills@latest add Klerith/fernando-skills`.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss` PostCSS plugin; no `tailwind.config.js`
- **Supabase** — Postgres + Auth via `@supabase/ssr` + `@supabase/supabase-js` (tables `games`, `scores` with RLS)
- **ESLint 9** flat config (`eslint.config.mjs`) + **Prettier** (`.prettierrc.json`)
- Path alias: `@/*` → project root
- Local fonts: Press Start 2P (`--font-pixel`) + JetBrains Mono (`--font-mono`). Retro arcade / neon-CRT aesthetic; UI copy is in Spanish.

## Skills

- **`/frontend-design`** — always use to build or change user interfaces (backed by `ui-ux-pro-max`).
- **`/add-game`** — designs the two chained specs needed to add a real game (Spec A: engine + canvas; Spec B: Supabase catalog row). Never writes code, only `.md` files in `specs/`.
- **`/spec`** + **`/spec-impl`** — Spec Driven Design workflow (from `Klerith/fernando-skills`). Config in `specs/.spec-config.yml`.

## Architecture

Uses the **App Router** (`app/` directory). Prefer Server Components by default; add `"use client"` only when interactivity or browser APIs are required.

### Routes

- `/` (`app/page.tsx`) — landing / home (client, animated)
- `/games` — game catalog grid (server; reads `getGames`)
- `/juego/[id]` — game detail + leaderboard (server; `getGameWithStats` + `getTopScores`)
- `/jugar/[id]` — the actual playable game (server shell → `GamePlayer` client component)
- `/salon` — Hall of Fame (server; `getGames`)
- `/about` — about + contact form
- `/auth` — sign in / sign up (client; local `AuthProvider`, not yet Supabase Auth)
- `/health-supabase` — temporary connection check (deletable)

### Data & Supabase

- `lib/supabase/client.ts` — browser client (`createBrowserClient`); use in client components.
- `lib/supabase/server.ts` — server client (`createServerClient` + cookies); use in Server Components.
- `lib/supabase/queries.ts` — all data access: `getGames`, `getGame`, `getGameWithStats`, `getTopScores`, `insertScore`. Add queries here, don't inline `.from()` in pages.
- `lib/supabase/database.types.ts` — generated DB types.
- `app/data/types.ts` — shared domain types (`Game`, `GameCategory`, `GameColor`, `ScoreRow`).
- `app/data/*` — static seed/mock data used by the home page only.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`.env.local`).

### Games

Four playable games: **asteroides, tetris, arkanoid, snake**. Each lives in `components/games/<slug>/` as two files:

- `engine.ts` — pure TS game engine (state, physics, `update()`, exports a `<Slug>Snapshot` type).
- `<Slug>Canvas.tsx` — client component rendering the engine to `<canvas>`; forwards a ref handle (`reset()`, `forceGameOver()`) and reports state via an `onSnapshot` callback.

`components/GamePlayer.tsx` is the shared player shell: branches by `game.id`, owns the HUD (score/lives/level/pause/end), and calls `insertScore()` on save. To wire a new game, add its branch here. Games not backed by an engine fall back to a decorative fake-score arena.

`app/globals.css` holds all styling incl. per-game `.cover-<slug>` cover-art classes.

## Next.js 16 Docs

Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Key areas:

- `01-app/01-getting-started/` — App Router fundamentals
- `01-app/01-getting-started/07-mutating-data.md` — Server Actions
- `01-app/01-getting-started/08-caching.md` — caching model (changed significantly)
- `01-app/03-api-reference/` — full API reference
