# Guía de Desarrollo - Limt

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 20+
- pnpm
- Docker & Docker Compose
- Make (opcional pero recomendado)

### Configuración Inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd li.mt.service
   ```

2. **Copiar variables de entorno**
   ```bash
   cp .example.env .env
   ```

3. **Configurar variables de entorno**
   Edita `.env` y añade:
   - `BETTER_AUTH_SECRET` (genera uno con: `openssl rand -base64 32`)
   - OAuth credentials (opcional para desarrollo)

4. **Setup automático con Make**
   ```bash
   make setup
   ```
   
   Esto ejecutará:
   - Instalación de dependencias
   - Inicio de PostgreSQL en Docker
   - Migraciones de base de datos

5. **Iniciar desarrollo**
   ```bash
   make dev
   ```

### Setup Manual (sin Make)

Si prefieres no usar Make:

```bash
# Instalar dependencias
pnpm install

# Iniciar base de datos
docker compose up -d

# Esperar a que PostgreSQL esté listo
sleep 5

# Aplicar schema a la base de datos
npx prisma db push

# Iniciar servidor de desarrollo
pnpm dev
```

## 📦 Comandos Make Disponibles

### Desarrollo
```bash
make dev           # Iniciar servidor de desarrollo
make build         # Build de producción
make start         # Iniciar servidor de producción
```

### Testing
```bash
make test          # Ejecutar tests
make test-ui       # Tests con interfaz visual
make test-watch    # Tests en modo watch
make test-coverage # Tests con reporte de cobertura
```

### Base de Datos (Docker)
```bash
make db-up         # Iniciar PostgreSQL
make db-down       # Detener PostgreSQL
make db-restart    # Reiniciar PostgreSQL
make db-logs       # Ver logs de PostgreSQL
make db-shell      # Abrir shell de PostgreSQL
```

### Base de Datos (Prisma)
```bash
make db-migrate    # Crear y aplicar migraciones
make db-push       # Aplicar cambios de schema (dev only)
make db-studio     # Abrir Prisma Studio
make db-reset      # Reset completo de la base de datos
```

### Calidad de Código
```bash
make lint          # Ejecutar ESLint
make format        # Formatear código con Prettier
```

### Utilidades
```bash
make clean         # Limpiar builds y dependencias
make help          # Ver todos los comandos disponibles
```

## 🗄️ Base de Datos

### Configuración Local

El proyecto usa PostgreSQL en Docker. Credenciales por defecto:

- **Host**: localhost
- **Puerto**: 5432
- **Base de datos**: limt
- **Usuario**: limt
- **Contraseña**: limt_dev_password

**Connection String**:
```
postgresql://limt:limt_dev_password@localhost:5432/limt
```

### Workflow de Desarrollo

1. **Modificar el schema**
   Edita `prisma/schema.prisma`

2. **Aplicar cambios (desarrollo)**
   ```bash
   make db-push
   ```
   
   O para crear una migración:
   ```bash
   make db-migrate
   ```

3. **Regenerar cliente Prisma** (automático con `make dev`)
   ```bash
   npx prisma generate
   ```

### Acceder a la Base de Datos

**Via Prisma Studio** (interfaz visual):
```bash
make db-studio
```

**Via CLI** (psql):
```bash
make db-shell
```

**Via Cliente Externo**:
Usa las credenciales arriba con tu cliente favorito (TablePlus, DBeaver, etc.)

## 🧪 Testing

### Escribir Tests

Todos los tests están en `__tests__/`:

```
__tests__/
├── helpers.ts              # Utilidades de testing
├── setup.ts                # Configuración global
├── lib/
│   ├── actions/           # Tests de server actions
│   ├── validations/       # Tests de schemas Zod
│   └── *.test.ts          # Tests de utilidades
```

### Ejecutar Tests

```bash
# Ejecutar todos los tests
make test

# Tests en modo watch (desarrollo)
make test-watch

# Tests con UI interactiva
make test-ui

# Tests con reporte de cobertura
make test-coverage
```

### Requisitos de Testing

⚠️ **IMPORTANTE**: Todos los nuevos features deben incluir tests.

- ✅ Test de casos de éxito
- ✅ Test de casos de error
- ✅ Test de validaciones
- ✅ Test de autenticación
- ✅ Test de scope organizacional

## 🔧 Tecnologías

- **Framework**: Next.js 16
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL + Prisma 7
- **Auth**: Better Auth
- **UI**: Shadcn/ui + Tailwind CSS v4
- **Testing**: Vitest + Testing Library
- **Validación**: Zod v4

## 📝 Convenciones

Ver [CLAUDE.md](./CLAUDE.md) y [.clinerules](./.clinerules) para:
- Guías de estilo
- Patrones de arquitectura
- Convenciones de nombres
- Reglas de negocio

## 🐛 Troubleshooting

### El servidor no inicia
```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps

# Ver logs
make db-logs

# Reiniciar base de datos
make db-restart
```

### Errores de Prisma
```bash
# Regenerar cliente
npx prisma generate

# Reset completo (¡cuidado, borra datos!)
make db-reset
```

### Limpiar y empezar de cero
```bash
# Detener base de datos
make db-down

# Limpiar todo
make clean

# Setup desde cero
make setup
```

## 🔐 Variables de Entorno

### Requeridas
- `DATABASE_URL` - Connection string de PostgreSQL
- `BETTER_AUTH_SECRET` - Secret para encriptación de sesiones
- `BETTER_AUTH_URL` - URL de la aplicación

### Opcionales (OAuth)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`

**Nota**: Sin OAuth configurado, solo funcionará login con Magic Link.

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Better Auth Docs](https://www.better-auth.com)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com)
