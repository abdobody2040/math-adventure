# Math Adventure

**Math Adventure** is a child-safe, bilingual math-learning MVP that frames short mathematical practice as a friendly adventure. It offers a mobile-first child experience with an adventure map, interactive questions, rewards, and a parent-only overview of learning progress.

## What is included

| Area | Included MVP capability |
|---|---|
| Parent space | Secure platform authentication, multiple child profiles, localized edit/soft deletion, privacy controls, controlled export, weekly reports, and parent-only learning insights. |
| Child learning | Eight adventure worlds, short interactive questions, guided hints, deterministic boss challenges, immediate feedback, and touch-safe lesson interactions. |
| Progression | Server-calculated XP, coins, levels, daily streaks, achievements, daily and weekly quests, mastery, world unlocks, cosmetics, and healthy companion pets. |
| Privacy | Parent ownership checks on every child-data procedure, server-enforced export preference, no public profiles/chat/social features, and no client-supplied correctness values. |
| Languages | English and Arabic strings, runtime language switcher, RTL document direction, and locale-aware number formatting. |
| PWA | Manifest, install prompt handling, network-first service worker, static curriculum cache, offline status feedback, answer queueing, secure sync, duplicate prevention, and reconnect feedback. |
| Admin | Server-enforced content studio for worlds, skills, templates, quests, rewards, safe unpublishing, and aggregate-only analytics. |

## Technology

The application uses React, TypeScript, Vite, Tailwind CSS 4, Express, tRPC, Drizzle ORM, MySQL/TiDB, and Manus OAuth. The frontend calls typed tRPC procedures; sensitive learning and authorization logic remain on the server.

## Run locally

```bash
pnpm install
pnpm dev
```

The development server supplies the environment configuration required by the managed project. Do not commit `.env` files or replace the existing OAuth and database environment wiring.

## Database workflow

The schema lives in `drizzle/schema.ts`. The project includes the following applied migrations:

| Migration | Purpose |
|---|---|
| `0001_icy_spot.sql` | Child profiles, curriculum, question sessions and attempts, rewards, quests, achievement records, skill progress, and world progress. |
| `0002_bizarre_korath.sql` | Persisted learning sessions used for parent learning-time insight. |
| `0003_*` | Extended learning, reward, parent-control, adaptive, analytics, and offline-sync foundations. |
| `0004_volatile_domino.sql` | Privacy-conscious adaptive performance snapshots. |
| `0005_magical_jean_grey.sql` | Safe quest enablement without deleting progress history. |

When changing schema code, generate a migration with `pnpm drizzle-kit generate`, review the generated SQL, and apply it through the managed database workflow. Do not alter child or progress data through unreviewed destructive SQL.

## Product and privacy model

The signed-in adult owns their parent profile. Every child query or mutation first validates that the selected child belongs to that parent profile. Question answers are stored and evaluated on the server through an expiring question-session record; the correct answer is not returned to the browser. Reward, mastery, streak, and unlock calculations are also performed on the server.

The child-facing product intentionally excludes public chat, messaging, social profiles, user-generated public content, and stranger contact. The optional server-only tutor provides a short guided hint only; it has answer-reveal/personal-data guardrails, localized fallback behavior, and per-parent/child request limits. It is not exposed as an unrestricted chatbot.

## Curriculum and adaptive play

The seeded curriculum contains eight worlds spanning core number sense through logic. The deterministic question engine uses template data and server-created session identifiers; it supports choice, numeric, true/false, ordering, matching, visual, word-problem, timed, and authored boss interactions. The server selects adaptive skill, activity, and difficulty using mastery and recent stored performance snapshots.

| World | Foundational skills |
|---|---|
| Number Valley | Number sense and counting |
| Addition Forest | Addition and number bonds |
| Subtraction Desert | Subtraction and mental strategies |
| Multiplication Mountains | Groups, multiplication concepts, and tables |
| Division Kingdom | Equal groups and division |
| Fraction Islands | Fraction concepts and comparison |
| Geometry City | Shapes, perimeter, and area |
| Logic Castle | Patterns, sequences, and reasoning |

World progression, boss rewards, and later-world unlocking are calculated and persisted by the server. Bosses use authored multi-skill templates rather than relabelled regular questions.

## Quality checks

```bash
pnpm test
pnpm check
pnpm build
```

The test suite covers authorization, deterministic template-driven question generation, boss and adaptive decisions, parent-export privacy, analytics contracts, tutor guardrails/rate limiting, offline duplicate prevention, English/Arabic localization, and protected administration routing.

## Scope notes

The project has progressed beyond the original MVP, but it is not represented as production-complete. Stripe payment and premium-entitlement work are blocked until the project owner provides compatible provider credentials. Parent reminder delivery requires an app-user notification provider; the available project-owner notification channel is intentionally not used for parent messages. A real signed-in parent/child acceptance pass, accessibility audit, and live service-worker/reconnect validation remain required. See [`docs/prd-gap-review.md`](docs/prd-gap-review.md) for a conservative PRD comparison.

## Repository hygiene

Commit source code, migrations, documentation, and tests. Do not commit credentials, deployment tokens, or parent/child records. Use protected branches and review schema changes before merging.
