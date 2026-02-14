# Limt — Modern Link Management Platform

A professional SaaS link shortener with analytics, team management, and custom domains.

## 🚀 Quick Start

### Con Make (Recomendado)

```bash
# Setup completo: instala dependencias, inicia PostgreSQL y migra DB
make setup

# Inicia el servidor de desarrollo
make dev
```

### Sin Make

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .example.env .env
# Edita .env y añade BETTER_AUTH_SECRET (ejecuta: openssl rand -base64 32)

# Iniciar PostgreSQL (Docker)
docker compose up -d

# Aplicar schema a la base de datos
npx prisma db push

# Iniciar servidor de desarrollo
pnpm dev
```

Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 🛠 Tech Stack

- **Next.js 16** — App Router, React 19, Server Actions
- **TypeScript** — Strict mode
- **PostgreSQL** — Docker Compose para desarrollo local
- **Prisma 7** — ORM con PrismaPg adapter
- **Better Auth** — OAuth (Google, GitHub) + Magic Link
- **Shadcn/ui** — UI components
- **Tailwind CSS v4** — Styling
- **Zod v4** — Input validation
- **Vitest** — Unit & integration testing

## 📦 Comandos Make

```bash
make help          # Ver todos los comandos disponibles
make dev           # Desarrollo
make test          # Ejecutar tests
make db-up         # Iniciar PostgreSQL
make db-studio     # Abrir Prisma Studio
make db-shell      # Shell de PostgreSQL
```

## 📚 Documentación

- **[QUICKSTART.md](./QUICKSTART.md)** — ⚡️ Guía de inicio rápido (5 minutos)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — 🛠 Guía completa de desarrollo (comandos, workflow, troubleshooting)
- **[CLAUDE.md](./CLAUDE.md)** — 🏗️ Arquitectura, convenciones y patrones del proyecto
- **[.clinerules](./.clinerules)** — ✅ Reglas de desarrollo y testing

## 🗄️ Base de Datos

PostgreSQL local via Docker Compose:

```
Host: localhost:5432
Database: limt
User: limt
Password: limt_dev_password
```

## 🧪 Testing

```bash
make test              # Ejecutar todos los tests
make test-watch        # Tests en modo watch
make test-ui           # Tests con UI interactiva
make test-coverage     # Tests con reporte de cobertura
```

⚠️ **Todos los nuevos features deben incluir tests**

## 📝 License

Private & Confidential
