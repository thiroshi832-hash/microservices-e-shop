.PHONY: help build up down logs clean test dev-frontend

help:
	@echo "Available commands:"
	@echo "  make build        - Build all Docker images"
	@echo "  make up          - Start all services (detached)"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - Follow logs from all services"
	@echo "  make restart     - Restart all services"
	@echo "  make clean       - Remove all containers and volumes"
	@echo "  make test        - Run frontend tests"
	@echo "  make dev-frontend - Start frontend in dev mode (localhost:3000)"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

test:
	cd frontend && npm test

dev-frontend:
	cd frontend && npm run dev
