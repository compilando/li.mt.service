# Limt — Modern Link Management Platform

A professional SaaS link shortener with analytics, team management, and custom domains.

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .example.env .env
# Edit .env with your credentials

# Push database schema
npx prisma db push

# Start development server
pnpm dev
```

## Tech Stack

- **Next.js 16** — App Router, React 19
- **TypeScript** — Strict mode
- **Prisma 7** — PostgreSQL with PrismaPg adapter
- **Better Auth** — OAuth (Google, GitHub) + Magic Link
- **Shadcn/ui** — UI components + Tailwind CSS v4
- **Zod v4** — Input validation

## Documentation

See [CLAUDE.md](./CLAUDE.md) for full architecture documentation, conventions, and development guidelines.
