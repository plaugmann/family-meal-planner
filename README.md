# Family Meal Planner

Private PWA for weekly family dinner planning (exactly 3 dinners/week).

## Tech stack
- Next.js (App Router) + API routes
- TypeScript
- PostgreSQL
- Prisma ORM
- PWA (mobile-first)

## Monorepo structure
- apps/web
  - Next.js app + API routes
- packages/db
  - Prisma schema, migrations, seed

## Status
MVP in progress.

## Windows setup
This repo uses a root `.env` as the single source of truth for `DATABASE_URL`.
The scripts below load `DATABASE_URL` from the root `.env` to keep Prisma and Next.js consistent.

1) Create `.env` at the repo root:
```
DATABASE_URL=postgres://family_meal_planner_app:YOUR_PASSWORD@localhost:5432/family_meal_planner
```

2) Install dependencies:
```
cd packages\db
npm install
cd ..\..\apps\web
npm install
```

3) Prisma (schema + seed):
```
cd ..\..\packages\db
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

4) Generate Prisma client for the web app:
```
cd ..\..\apps\web
npm run prisma:generate
```

5) Start Next.js:
```
npm run dev
```

Optional: if you want Next.js to use its default `.env.local` loading, copy the root env:
```
node scripts\sync-env.cjs
```
