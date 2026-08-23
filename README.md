# Math Adventure

**Math Adventure** is a child-safe, bilingual math-learning MVP that frames short mathematical practice as a friendly adventure. It offers a mobile-first child experience with an adventure map, interactive questions, rewards, and a parent-only overview of learning progress.

## What is included

| Area | Included MVP capability |
|---|---|
| Parent space | Secure platform authentication, child-profile creation, profile editing, and parent-only learning insights. |
| Child learning | Three starter worlds, ten foundational skills, short interactive questions, hints, immediate feedback, and guided solo battles. |
| Progression | Server-calculated XP, coins, levels, daily streaks, achievements, daily quests, mastery, and world unlocks. |
| Privacy | Parent ownership checks on every child-data procedure, no public profiles, no chat, no social features, and no client-supplied correctness values. |
| Languages | English and Arabic strings, runtime language switcher, RTL document direction, and locale-aware number formatting. |
| PWA | Manifest, install prompt handling, service worker registration, cached application shell, static curriculum cache, and offline status feedback. |
| Admin | Server-enforced admin procedure and a role-gated read-only starter-content studio. |

## Technology

The application uses React, TypeScript, Vite, Tailwind CSS 4, Express, tRPC, Drizzle ORM, MySQL/TiDB, and Manus OAuth. The frontend calls typed tRPC procedures; sensitive learning and authorization logic remain on the server.

## Run locally

```bash
pnpm install
pnpm dev
```

The development server supplies the environment configuration required by the managed project. Do not commit `.env` files or replace the existing OAuth and database environment wiring.

## Database workflow

The schema lives in `drizzle/schema.ts`. This project includes two applied migrations:

| Migration | Purpose |
|---|---|
| `0001_icy_spot.sql` | Child profiles, curriculum, question sessions and attempts, rewards, quests, achievement records, skill progress, and world progress. |
| `0002_bizarre_korath.sql` | Persisted learning sessions used for parent learning-time insight. |

When changing schema code, generate a migration with `pnpm drizzle-kit generate`, review the generated SQL, and apply it through the managed database workflow. Do not alter child or progress data through unreviewed destructive SQL.

## Product and privacy model

The signed-in adult owns their parent profile. Every child query or mutation first validates that the selected child belongs to that parent profile. Question answers are stored and evaluated on the server through an expiring question-session record; the correct answer is not returned to the browser. Reward, mastery, streak, and unlock calculations are also performed on the server.

The child-facing product intentionally excludes public chat, messaging, social profiles, user-generated public content, and stranger contact. The MVP ships no free-form AI tutor.

## Starter curriculum

The seeded curriculum contains three worlds and ten foundational skills.

| World | Foundational skills |
|---|---|
| Number Valley | Counting to 20, number recognition, number comparison, number sequences. |
| Addition Forest | Addition within 10, make ten, addition within 20. |
| Subtraction Desert | Subtraction within 10, subtraction within 20, number bonds. |

World two and world three are unlocked through persisted skill-mastery milestones. The deterministic question engine selects a seeded template and uses a server-created session identifier to make each session’s prompt reproducible.

## Quality checks

```bash
pnpm test
pnpm check
pnpm build
```

The test suite covers logout behavior, deterministic template-driven question generation, positive reward rules, mastery calculation, English/Arabic localization behavior, Arabic numerals, and the admin authorization boundary.

## Scope notes

This is an MVP. Subscription payments, advanced adaptive plans, AI tutoring, rich offline mutation synchronization, broader admin editing, pets, and native mobile wrappers are intentionally future milestones. The included PWA cache preserves the application shell and static starter curriculum; new child progress is saved while connected.

## Repository hygiene

Commit source code, migrations, documentation, and tests. Do not commit credentials, deployment tokens, or parent/child records. Use protected branches and review schema changes before merging.
