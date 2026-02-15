.PHONY: help install dev build start test test-ui test-watch test-coverage lint format db-up db-down db-restart db-logs db-shell db-migrate db-push db-studio db-seed db-reset clean

# Variables
DOCKER_COMPOSE = docker compose
PNPM = pnpm
PRISMA = npx prisma

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

## help: Show this help message
help:
	@echo "$(GREEN)Limt - Available Make Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup & Installation:$(NC)"
	@echo "  make install         - Install dependencies"
	@echo "  make setup          - Initial project setup (install + db + migrate)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev            - Start development server"
	@echo "  make build          - Build for production"
	@echo "  make start          - Start production server"
	@echo ""
	@echo "$(YELLOW)Testing:$(NC)"
	@echo "  make test           - Run tests"
	@echo "  make test-ui        - Run tests with UI"
	@echo "  make test-watch     - Run tests in watch mode"
	@echo "  make test-coverage  - Run tests with coverage"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  make lint           - Run linter"
	@echo "  make format         - Format code with prettier"
	@echo ""
	@echo "$(YELLOW)Database (Docker):$(NC)"
	@echo "  make db-up          - Start PostgreSQL database"
	@echo "  make db-down        - Stop PostgreSQL database"
	@echo "  make db-restart     - Restart PostgreSQL database"
	@echo "  make db-logs        - View database logs"
	@echo "  make db-shell       - Open PostgreSQL shell"
	@echo ""
	@echo "$(YELLOW)Database (Prisma):$(NC)"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-push        - Push schema changes (dev only)"
	@echo "  make db-studio      - Open Prisma Studio"
	@echo "  make db-seed        - Seed database with test data"
	@echo "  make db-reset       - Reset database (drop + migrate + seed)"
	@echo ""
	@echo "$(YELLOW)Cleanup:$(NC)"
	@echo "  make clean          - Clean build artifacts and dependencies"

## install: Install project dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	$(PNPM) install

## setup: Complete initial project setup
setup: install db-up
	@echo "$(GREEN)Waiting for database to be ready...$(NC)"
	@sleep 5
	@echo "$(GREEN)Running database migrations...$(NC)"
	$(MAKE) db-push
	@echo "$(GREEN)Seeding database with test data...$(NC)"
	$(MAKE) db-seed
	@echo "$(GREEN)Setup complete! Run 'make dev' to start development$(NC)"

## dev: Start development server
dev:
	@echo "$(GREEN)Starting development server...$(NC)"
	$(PNPM) dev

## build: Build for production
build:
	@echo "$(GREEN)Building for production...$(NC)"
	$(PNPM) build

## start: Start production server
start:
	@echo "$(GREEN)Starting production server...$(NC)"
	$(PNPM) start

## test: Run tests
test:
	@echo "$(GREEN)Running tests...$(NC)"
	$(PNPM) test --run

## test-ui: Run tests with UI
test-ui:
	@echo "$(GREEN)Running tests with UI...$(NC)"
	$(PNPM) test:ui

## test-watch: Run tests in watch mode
test-watch:
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	$(PNPM) test:watch

## test-coverage: Run tests with coverage report
test-coverage:
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	$(PNPM) test:coverage

## lint: Run ESLint
lint:
	@echo "$(GREEN)Running linter...$(NC)"
	$(PNPM) lint

## format: Format code with Prettier
format:
	@echo "$(GREEN)Formatting code...$(NC)"
	$(PNPM) format

## db-up: Start PostgreSQL database
db-up:
	@echo "$(GREEN)Starting PostgreSQL database...$(NC)"
	$(DOCKER_COMPOSE) up -d postgres
	@echo "$(GREEN)Database started at localhost:5432$(NC)"
	@echo "$(YELLOW)Database: limt$(NC)"
	@echo "$(YELLOW)User: limt$(NC)"
	@echo "$(YELLOW)Password: limt_dev_password$(NC)"

## db-down: Stop PostgreSQL database
db-down:
	@echo "$(GREEN)Stopping PostgreSQL database...$(NC)"
	$(DOCKER_COMPOSE) down

## db-restart: Restart PostgreSQL database
db-restart:
	@echo "$(GREEN)Restarting PostgreSQL database...$(NC)"
	$(DOCKER_COMPOSE) restart postgres

## db-logs: View database logs
db-logs:
	@echo "$(GREEN)Database logs:$(NC)"
	$(DOCKER_COMPOSE) logs -f postgres

## db-shell: Open PostgreSQL shell
db-shell:
	@echo "$(GREEN)Opening PostgreSQL shell...$(NC)"
	$(DOCKER_COMPOSE) exec postgres psql -U limt -d limt

## db-migrate: Run database migrations
db-migrate:
	@echo "$(GREEN)Running database migrations...$(NC)"
	$(PRISMA) migrate dev

## db-push: Push schema changes to database (dev only)
db-push:
	@echo "$(GREEN)Pushing schema changes...$(NC)"
	$(PRISMA) db push

## db-studio: Open Prisma Studio
db-studio:
	@echo "$(GREEN)Opening Prisma Studio...$(NC)"
	$(PRISMA) studio

## db-seed: Seed database with test data
db-seed:
	@echo "$(GREEN)Seeding database...$(NC)"
	$(PNPM) db:seed

## db-reset: Reset database (drop + migrate + seed)
db-reset:
	@echo "$(YELLOW)WARNING: This will delete all data!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds...$(NC)"
	@sleep 5
	@echo "$(GREEN)Resetting database...$(NC)"
	$(PRISMA) migrate reset --force

## clean: Clean build artifacts and dependencies
clean:
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf .next
	rm -rf node_modules
	rm -rf dist
	rm -rf out
	@echo "$(GREEN)Clean complete!$(NC)"
