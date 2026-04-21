# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Frontend)
- Complete React TypeScript frontend with Vite
- Tailwind CSS styling with responsive design
- React Router v6 with protected routes
- Authentication context with JWT handling
- Shopping cart context with persistence
- Complete product catalog pages (listing, detail)
- User authentication pages (login, register)
- Shopping cart page with quantity management
- Checkout flow with order placement
- User order history and order detail views
- User profile page
- React Query for data fetching and caching
- React Hook Form for form handling
- Toast notifications for user feedback
- Loading states and error handling
- Production Dockerfile with Nginx

### Changed (Backend)
- Migrated all services from raw PostgreSQL to Prisma ORM
- Updated user-service to use Prisma with type-safe queries
- Updated product-service to use Prisma with filtering
- Updated order-service to use Prisma with joins
- Replaced custom db.js with Prisma client in each service
- Updated Dockerfiles to run prisma generate and db push
- Updated docker-compose with DATABASE_URL environment
- Added prisma.js client wrapper with logging

### Added (DevOps & Documentation)
- Root-level package.json for monorepo management
- Commitlint configuration for conventional commits
- Husky Git hooks for pre-commit validation
- Standard-version for automated versioning
- Lerna for monorepo tooling
- VERSIONING.md guide for release management
- CONTRIBUTING.md for open-source contributions
- scripts/setup.sh and setup.bat for new developers
- .commitlintrc.js and .huskyrc.js configurations
- .versionrc.json for standard-version customization

### Security
- Prisma ORM removes SQL injection risks
- Parameterized queries enforced via Prisma
- Type safety prevents common errors
- Environment-based secrets configuration

## [1.0.0] - 2025-04-22

### Added
- First stable release of production-ready microservices e-commerce platform
- Full CRUD operations for products
- User registration and authentication
- Order creation and management
- Service-to-service communication with error handling
- Event-driven architecture with Redis Pub/Sub
- Docker deployment with isolated services
- Health monitoring and structured logging
