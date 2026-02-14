# ⚡️ Quick Start Guide — Limt

Esta guía te ayudará a tener el proyecto corriendo en menos de 5 minutos.

## Requisitos Previos

Asegúrate de tener instalado:
- ✅ Node.js 20+ (`node --version`)
- ✅ pnpm (`pnpm --version` o instalar con `npm install -g pnpm`)
- ✅ Docker Desktop (`docker --version`)
- ✅ Make (opcional, viene preinstalado en Mac/Linux)

## Instalación en 3 Pasos

### 1. Clonar y configurar

```bash
# Clonar repositorio
git clone <repository-url>
cd li.mt.service

# Copiar variables de entorno
cp .example.env .env
```

### 2. Editar .env

Abre `.env` y añade **solo esta línea** (el resto ya está configurado):

```bash
BETTER_AUTH_SECRET=tu_secret_aqui_generado_con_openssl
```

**Generar el secret:**
```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en `.env`.

### 3. Setup automático

```bash
make setup
```

Esto ejecutará automáticamente:
- ✅ Instalación de dependencias (`pnpm install`)
- ✅ Inicio de PostgreSQL en Docker
- ✅ Creación de base de datos y aplicación de schema

## Iniciar Desarrollo

```bash
make dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000) 🎉

## Comandos Esenciales

```bash
# Desarrollo
make dev                # Iniciar servidor de desarrollo
make test               # Ejecutar tests
make lint               # Linter

# Base de datos
make db-studio          # Abrir interfaz visual de BD
make db-shell           # Abrir PostgreSQL CLI
make db-logs            # Ver logs de PostgreSQL

# Ver todos los comandos
make help
```

## Troubleshooting

### "El puerto 5432 ya está en uso"

Ya tienes PostgreSQL corriendo localmente. Opciones:
1. Detén tu PostgreSQL local: `sudo service postgresql stop`
2. O cambia el puerto en `docker-compose.yml` (ej: `5433:5432`)

### "make: command not found"

No tienes Make instalado. Usa los comandos manuales:

```bash
# En lugar de 'make setup'
pnpm install
docker compose up -d
sleep 5
npx prisma db push

# En lugar de 'make dev'
pnpm dev
```

### Error de conexión a base de datos

Verifica que Docker esté corriendo:
```bash
docker ps  # Deberías ver 'limt-postgres'
```

Si no aparece:
```bash
make db-up
# o
docker compose up -d
```

## Próximos Pasos

1. 📖 Lee [DEVELOPMENT.md](./DEVELOPMENT.md) para guía completa de desarrollo
2. 🏗️ Revisa [CLAUDE.md](./CLAUDE.md) para entender la arquitectura
3. ✅ Mira `.clinerules` para las reglas de código y testing

## Acceso Rápido

| Recurso       | URL                                              |
| ------------- | ------------------------------------------------ |
| App           | http://localhost:3000                            |
| Prisma Studio | http://localhost:5555 (ejecuta `make db-studio`) |
| API Docs      | TBD                                              |

| Base de Datos | Valor             |
| ------------- | ----------------- |
| Host          | localhost:5432    |
| Database      | limt              |
| User          | limt              |
| Password      | limt_dev_password |

---

¿Problemas? Abre un issue o contacta al equipo 💪
