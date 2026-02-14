# CLAUDE.md — Limt Project Context

> This file provides context for AI assistants (Claude, Cline, Cursor, etc.) working on this project.

## Project Overview

**Limt** (li.mt) is a modern SaaS link management platform — a professional URL shortener with analytics, team management, and custom domains.

- **Product name:** Limt
- **Repository:** `li.mt.service`
- **Live URL:** TBD
- **Stage:** Early development (MVP)

## Tech Stack

| Layer       | Technology                               |
| ----------- | ---------------------------------------- |
| Framework   | Next.js 16 (App Router)                  |
| Language    | TypeScript (strict)                      |
| Database    | PostgreSQL (Docker Compose) + Prisma 7   |
| Auth        | Better Auth (Google, GitHub, Magic Link) |
| UI          | Shadcn/ui + Radix UI + Tailwind CSS v4   |
| Validation  | Zod v4                                   |
| Testing     | Vitest + Testing Library                 |
| Package Mgr | pnpm                                     |
| Dev Tools   | Make, Docker Compose                     |
| Fonts       | Inter (sans), Geist (mono)               |

## Architecture

### Directory Structure

```
app/
├── page.tsx                    → Root (redirects to /app or /signin)
├── layout.tsx                  → Root layout (ThemeProvider, fonts)
├── not-found.tsx               → 404 page
├── app/                        → Dashboard (protected, requires auth)
│   ├── layout.tsx              → Auth guard + Dashboard shell
│   ├── page.tsx                → Redirects to /app/links
│   ├── error.tsx               → Error boundary
│   ├── links/
│   │   ├── page.tsx            → Links page (server component)
│   │   └── content.tsx         → Links content (client component)
│   └── analytics/
│       ├── page.tsx
│       └── content.tsx
├── signin/                     → Auth pages
├── r/[shortCode]/route.ts      → Short link redirector + tracking
└── api/
    └── auth/[...all]/route.ts  → Better Auth API handler

components/
├── ui/                         → Shadcn/ui primitives (DO NOT edit)
├── dashboard/                  → Dashboard-specific components
│   ├── header.tsx
│   ├── link-create.tsx
│   ├── link-card.tsx
│   ├── link-list.tsx
│   └── stats-cards.tsx
├── app-sidebar.tsx
├── dashboard.tsx               → Main dashboard layout shell
├── nav-main.tsx
├── nav-user.tsx
├── team-switcher.tsx
└── theme-provider.tsx

lib/
├── auth.ts                     → Better Auth server config
├── auth-client.ts              → Better Auth client
├── prisma.ts                   → Prisma client singleton
├── user.ts                     → Session/user helpers
├── utils.ts                    → cn() utility
├── constants.ts                → App constants, plan limits
├── errors.ts                   → Error classes + ActionResult type
├── short-code.ts               → Short code generation (nanoid)
├── actions/                    → Server actions
│   ├── links.ts                → CRUD for links
│   ├── analytics.ts            → Click tracking & analytics queries
│   └── tags.ts                 → Tag management
├── validations/                → Zod schemas
│   ├── link.ts
│   ├── tag.ts
│   └── domain.ts
└── organization/
    └── utils.ts                → Auto-create personal org on signup

hooks/
├── use-active-organization.ts  → Global reactive org state
└── use-mobile.ts               → Mobile viewport detection

prisma/
└── schema.prisma               → Database schema

generated/                      → Prisma generated client (DO NOT edit)
```

### Key Patterns

1. **Server Actions** — All mutations go through `lib/actions/*.ts` with `"use server"` directive
2. **ActionResult pattern** — Actions return `{ success: true, data } | { success: false, error }` — never throw
3. **Auth guard** — `app/app/layout.tsx` checks session server-side and redirects to `/signin`
4. **Organization scope** — All links belong to an organization. Users can switch between orgs
5. **Global state** — `useActiveOrganization()` uses `useSyncExternalStore` for reactive org state without external state lib
6. **Page pattern** — `page.tsx` (server) exports metadata + renders `content.tsx` (client) for interactive pages

### Database Models

- **User** → Sessions, Accounts (OAuth)
- **Organization** → Members, Links, Domains, Tags, ApiKeys
- **Link** → shortCode (unique), URL, UTM params, OG overrides, mobile targets, password, expiration
- **LinkClick** → Per-click analytics (geo, device, browser, referrer, hashed IP)
- **Tag** → Color-coded, org-scoped, many-to-many with Link via LinkTag
- **Domain** → Custom domains per organization
- **ApiKey** → Programmatic access (hashed keys)

### Auth Flow

1. User visits `/signin` → Google/GitHub OAuth or Magic Link
2. Better Auth handles OAuth callbacks via `/api/auth/[...all]`
3. On first signup, a "Personal" organization is auto-created (database hook)
4. Session stored in cookie, checked in `app/app/layout.tsx`

## Conventions

### Code Style
- **Indentation:** Editor auto-formats (4 spaces in most files, 2 in some)
- **Quotes:** Double quotes
- **Semicolons:** Yes
- **Imports:** `@/` alias for root
- **Components:** PascalCase files for components, kebab-case for pages
- **Server Actions:** Always in `lib/actions/`, always return `ActionResult`

### UI Guidelines
- **Keep it simple and clean** — No unnecessary visual complexity
- **Shadcn/ui first** — Use existing components from `components/ui/`
- **Responsive** — Mobile-first, test at 768px breakpoint
- **Icons:** Lucide React only
- **Colors:** Use CSS variables (oklch) defined in `globals.css`

### Do NOT
- Edit files in `generated/` (auto-generated by Prisma)
- Edit files in `components/ui/` (managed by Shadcn CLI)
- Use `any` type (use `unknown` or proper types)
- Import from `node_modules` directly for UI (use Shadcn wrappers)
- Store secrets in code (use environment variables)

## Testing

### Philosophy
**TESTING IS MANDATORY.** All new features, utilities, validations, and server actions MUST include comprehensive unit tests before being considered complete.

### Test Framework
- **Vitest** — Fast, modern test runner with great DX
- **Testing Library** — React component testing
- **Coverage thresholds:** 80% statements, 75% branches, 80% functions, 80% lines

### Test Structure
```
__tests__/
├── setup.ts                    # Global mocks & test configuration
├── helpers.ts                  # Reusable test utilities & factories
└── lib/
    ├── short-code.test.ts      # Unit tests for utilities
    ├── errors.test.ts
    ├── utils.test.ts
    ├── constants.test.ts
    ├── validations/            # Zod schema tests
    │   ├── link.test.ts
    │   ├── tag.test.ts
    │   └── domain.test.ts
    └── actions/                # Server action tests (with mocks)
        ├── links.test.ts
        └── tags.test.ts
```

### Running Tests
```bash
pnpm test              # Run all tests (watch mode)
pnpm test --run        # Run once (CI mode)
pnpm test:ui           # Open Vitest UI
pnpm test:coverage     # Generate coverage report
```

### What to Test
1. **Utilities & helpers** — Pure functions, edge cases, error handling
2. **Validation schemas** — Valid inputs, invalid inputs, edge cases, length limits
3. **Server actions** — Auth requirements, permissions, success/failure cases, data validation
4. **Error classes** — Correct status codes, messages, inheritance
5. **Constants** — Values are within expected ranges

### Test Patterns
```typescript
// Use factory functions from helpers.ts
import { mockAuthenticated, createMockLink } from "@/__tests__/helpers";

// Test server actions
describe("createLink", () => {
    it("requires authentication", async () => {
        mockUnauthenticated();
        const result = await createLink({ url: "...", organizationId: "..." });
        expect(result.success).toBe(false);
    });
});

// Test validations
describe("createLinkSchema", () => {
    it("accepts valid input", () => {
        expect(() => createLinkSchema.parse({ url: "...", organizationId: "..." })).not.toThrow();
    });
});
```

### Before Committing
1. ✅ Run `pnpm test --run` — All tests must pass
2. ✅ Ensure coverage thresholds are met
3. ✅ Add tests for any new code
4. ✅ Update existing tests if behavior changes

## Development Setup

### Quick Start with Make (Recommended)

```bash
make setup             # Complete setup: install deps + start DB + migrate
make dev               # Start development server
make test              # Run all tests
make db-studio         # Open Prisma Studio
make help              # See all available commands
```

### Manual Setup

```bash
pnpm install           # Install dependencies
docker compose up -d   # Start PostgreSQL
npx prisma db push     # Apply schema to database
pnpm dev               # Start dev server
```

### Database (Docker Compose)

PostgreSQL runs in Docker with these credentials:
- **Host:** localhost:5432
- **Database:** limt
- **User:** limt
- **Password:** limt_dev_password
- **Connection String:** `postgresql://limt:limt_dev_password@localhost:5432/limt`

```bash
make db-up             # Start PostgreSQL
make db-down           # Stop PostgreSQL
make db-shell          # Open PostgreSQL CLI
make db-logs           # View database logs
make db-studio         # Open Prisma Studio (GUI)
```

### Common Make Commands

**Development:**
- `make dev` — Start dev server (with Prisma generate)
- `make build` — Production build
- `make start` — Start production server

**Testing:**
- `make test` — Run tests once (CI mode)
- `make test-watch` — Run tests in watch mode
- `make test-ui` — Open Vitest UI
- `make test-coverage` — Generate coverage report

**Database:**
- `make db-push` — Push schema changes (dev)
- `make db-migrate` — Create migration (prod)
- `make db-reset` — Reset database (⚠️ deletes all data)

**Code Quality:**
- `make lint` — Run ESLint
- `make format` — Format with Prettier

**Utilities:**
- `make clean` — Clean build artifacts
- `make help` — See all commands

### Manual Commands (without Make)

```bash
pnpm dev               # Start dev server
pnpm build             # Production build
pnpm test              # Run tests (watch mode)
pnpm test --run        # Run tests once (CI)
pnpm test:coverage     # Generate coverage report
pnpm lint              # ESLint
pnpm format            # Prettier
npx prisma generate    # Regenerate Prisma client
npx prisma db push     # Push schema to database (dev)
npx prisma migrate     # Create migration (production)
npx prisma studio      # Open Prisma Studio
```

## Environment Variables

Copy `.example.env` to `.env` and configure:

**Required:**
- `DATABASE_URL` — PostgreSQL connection string (default: `postgresql://limt:limt_dev_password@localhost:5432/limt`)
- `BETTER_AUTH_SECRET` — Auth secret key (generate with: `openssl rand -base64 32`)
- `BETTER_AUTH_URL` — App base URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` — Public app URL (default: `http://localhost:3000`)

**Optional (for OAuth):**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth

**Note:** Without OAuth configured, only Magic Link authentication will work.

## Current Status & Roadmap

### Done ✅
- Auth (Google, GitHub, Magic Link)
- Organization system with auto-creation
- Prisma schema (Link, Domain, Tag, LinkClick, ApiKey)
- Server actions for links CRUD, analytics, tags
- Short link redirector with click tracking
- Dashboard with sidebar, org switcher
- Link creation form (URL, short code, title, UTM)
- Link list with search, copy, archive, delete
- Analytics page with stats cards
- Error/404 pages
- Zod validation schemas
- Middleware with security headers

### TODO 🚧
- Landing page (marketing)
- Domain management UI
- Settings page (org settings, API keys)
- Link detail/edit page
- Password-protected links verification page
- Email sending for magic links (currently console.log)
- Billing/subscription integration
- Rate limiting implementation
- API v1 routes for external access
- QR code generation
