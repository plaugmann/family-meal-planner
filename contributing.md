# CONTRIBUTING.md

Thank you for contributing to **Family Meal Planner**.

This is a **private MVP project** developed with the help of AI coding agents (e.g. CODEX).
The goal of this document is to ensure contributions remain focused, consistent, and aligned with the product vision.

---

## 📌 Project Purpose

Family Meal Planner is a private Progressive Web App (PWA) that helps one household:

- Plan exactly **3 family-friendly dinners per week**
- Reduce food waste
- Generate a correct shopping list with minimal effort

This is an MVP. **Scope discipline is critical.**

---

## 📖 Required Reading (Before Contributing)

All contributors **must read and follow**:

- `docs/product/vision.md`
- `docs/product/user-flows.md`
- `docs/product/mvp-scope.md`
- `AGENTS.md`

These documents are the **source of truth**.

---

## 🧱 Locked Stack & Structure

Do **not** change the following without explicit approval:

### Tech Stack
- Next.js (App Router)
- TypeScript
- PostgreSQL
- Prisma ORM
- REST APIs
- Tailwind CSS
- shadcn/ui
- lucide-react

### Monorepo Structure
```text
apps/web        # Next.js PWA + API routes
packages/db     # Prisma schema, migrations, seed
docs/           # Product & technical documentation
