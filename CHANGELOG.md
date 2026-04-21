# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with microservices architecture
- PostgreSQL database with schema for users, products, orders
- Redis-based event bus for inter-service communication
- JWT authentication with bcrypt password hashing
- API Gateway with rate limiting, CORS, Helmet security
- Winston structured logging across all services
- Joi input validation on all endpoints
- Graceful shutdown handling
- Docker containerization with docker-compose
- Health check endpoints for all services
- Comprehensive documentation and API examples

### Security
- Environment-based configuration
- Sensitive data excluded from version control via .gitignore
- JWT secret configuration via environment variables
- Rate limiting to prevent abuse
- Input sanitization and validation

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
