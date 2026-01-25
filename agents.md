# AGENTS.md

This repository is developed using AI coding agents (e.g. CODEX).
This document defines how agents are expected to behave, what they are allowed to do,
and how work should be structured.

This file is authoritative.

---

## 🎯 Project Context

Project: **Family Meal Planner**  
Type: Private MVP  
Users: One household (2 adults, 2 children)  
Platform: Next.js PWA + Prisma + PostgreSQL  

Primary goal:
> Enable a complete weekly dinner planning loop (exactly 3 dinners) with minimal effort and minimal food waste.

All agents must follow:
- `docs/product/vision.md`
- `docs/product/user-flows.md`
- `docs/product/mvp-scope.md`

---

## 🧠 Agent Role

Agents act as **senior full-stack engineers**.

Agents must:
- Prefer simple, explicit solutions
- Optimize for MVP speed and correctness
- Avoid abstraction unless it clearly reduces complexity
- Write readable, maintainable code
- Assume Windows (PowerShell) as a first-class dev environment

Agents must ask for clarification **before** making breaking architectural changes.

---

## 🔒 Locked Technical Stack

Agents may NOT change these without explicit instruction:

- Next.js (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- REST APIs (no GraphQL)
- Tailwind CSS
- shadcn/ui
- lucide-react

Monorepo structure is fixed:
- `apps/web` – Next.js PWA + API routes
- `packages/db` – Prisma schema, migrations, seed
- `docs/` – product & technical documentation

---

## 🚫 Hard MVP Constraints (Non-Negotiable)

Agents must NOT implement or introduce:

- Unit conversions (g ↔ dl ↔ cups)
- Nutrition calculations
- Expiry date tracking
- Quantity-based inventory
- Multi-household or social features
- Authentication beyond simple household access
- Internet-wide crawling (whitelist only)
- Fridge photo UI (stub only, backend-ready)

Exactly **3 dinner recipes per week** must be enforced.

Inventory is **presence-based only**.

---

## 📋 Task Execution Rules

Agents must work in **explicit tasks**, in order.

Before starting a new task:
- Confirm the previous task is complete
- Ensure repo builds and runs

When implementing a task:
- Do not mix unrelated changes
- Do not refactor “just because”
- Keep commits logically grouped

---

## 🧪 Definition of Done (Per Task)

A task is complete when:
- Code compiles and runs (`npm run dev`)
- Prisma schema is valid and migrated
- API routes return correct JSON
- UI flows match `user-flows.md`
- MVP constraints are respected
- Relevant docs are updated if behavior changes

---

## 📝 Documentation Rules

Agents must:
- Update documentation when contracts, flows, or structure change
- Treat documentation as a source of truth, not an afterthought
- Never contradict existing MVP scope

---

## 🛑 When to Stop and Ask

Agents must STOP and ask before:
- Adding a new dependency
- Adding a new API endpoint
- Changing the data model significantly
- Introducing background jobs, queues, or cron
- Introducing state management libraries (Redux, Zustand, etc.)

---

## 🧭 Guiding Principle

> If a feature does not clearly reduce weekly planning effort or food waste, it does not belong in this MVP.

Agents should optimize for **calm, clarity, and usefulness** — not cleverness.
