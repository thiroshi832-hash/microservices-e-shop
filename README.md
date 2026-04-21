# Node.js Microservices E-commerce Platform

A production-ready microservices e-commerce platform built with Node.js, Express, PostgreSQL, Redis, and Docker.

## Architecture

```
┌─────────────────┐
│   API Gateway   │  ← External Entry Point (Port 5000)
│   (Express)     │  - Rate limiting
│   - Auth        │  - Request logging
│   - Proxy       │  - JWT validation
└────────┬────────┘
         │
    ┌────┴────┬───────────────┐
    │         │               │
    ▼         ▼               ▼
┌───────┐ ┌─────────┐  ┌──────────┐
│ Users │ │Products │  │ Orders   │
│ :5001 │ │  :5002  │  │  :5003   │
└───────┘ └─────────┘  └──────────┘
    │         │               │
    └────┬────┴───────────────┘
         │
    ┌────▼─────────┐
    │  PostgreSQL  │  ← Persistent Storage
    │   (Port 5432)│
    └──────────────┘
         │
    ┌────▼─────────┐
    │     Redis    │  ← Event Bus & Caching
    │   (Port 6379)│
    └──────────────┘
```

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Service-to-Service Communication**: Secure internal communication
- **Event-Driven Architecture**: Redis Pub/Sub for events
- **Database**: PostgreSQL for persistent data
- **API Gateway**: Centralized routing, rate limiting, and security
- **Logging**: Winston-based structured logging
- **Input Validation**: Joi-based request validation
- **Docker**: Containerized deployment with docker-compose
- **Health Checks**: Built-in health endpoints for monitoring

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 5000 | Entry point, authentication, routing |
| User Service | 5001 | User registration, login, management |
| Product Service | 5002 | Product catalog management |
| Order Service | 5003 | Order creation and management |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Event bus and cache |

## Quick Start with Docker

1. Clone and navigate:
```bash
cd node-microservices-ecommerce
```

2. Build and start all services:
```bash
docker-compose up --build
```

3. All services will be running:
```
Gateway:  http://localhost:5000
Users:    http://localhost:5001
Products: http://localhost:5002
Orders:   http://localhost:5003
Database: localhost:5432
Redis:    localhost:6379
```

## API Endpoints

### Users API (`/users`)
- `POST /users/register` - Register new user
- `POST /users/login` - Login user
- `GET /users/:id` - Get user by ID (authenticated)
- `GET /users` - Get all users (admin only)

### Products API (`/products`)
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders API (`/orders` - Requires Auth)
- `POST /orders` - Create order
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status
- `GET /orders/user/:userId` - Get user's orders

## Authentication

All requests to `/orders/*` endpoints require a JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register:
```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

Response includes `token`:
```json
{
  "user": { "id": 1, "email": "john@example.com", "role": "customer" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

2. Use token for authenticated requests:
```bash
curl -X GET http://localhost:5000/orders \
  -H "Authorization: Bearer <token>"
```

## Environment Variables

Create `.env` file in each service directory or use the `.env.example`:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password123
DB_NAME=ecommerce

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Services
USER_SERVICE_URL=http://user-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002
ORDER_SERVICE_URL=http://order-service:5003

# API Gateway
PORT=5000
ALLOWED_ORIGINS=*
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT DEFAULT '',
  category VARCHAR(100) DEFAULT '',
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## Event Types

The system uses Redis Pub/Sub for event-driven communication:

- `USER_CREATED` - When a new user registers
- `USER_LOGGED_IN` - When a user logs in
- `PRODUCT_CREATED` - When a product is added
- `PRODUCT_UPDATED` - When a product is modified
- `PRODUCT_DELETED` - When a product is removed
- `ORDER_CREATED` - When an order is placed
- `ORDER_STATUS_UPDATED` - When order status changes

## Production Considerations

### Security
- Change `JWT_SECRET` to a strong random value (min 256-bit)
- Use HTTPS in production
- Enable CORS with specific origins
- Set strong database passwords
- Keep Docker images updated

### Monitoring
- Health check endpoints available at `/health` on all services
- Logs are written to files (`error.log`, `combined.log`) and console
- Consider adding Prometheus metrics or external log aggregation

### Scaling
- Stateless services can be horizontally scaled
- Use PostgreSQL read replicas for read-heavy workloads
- Redis cluster for high availability
- API Gateway can load balance across multiple instances

### Backup & Recovery
- Backup PostgreSQL regularly
- Configure Redis persistence (RDB/AOF)
- Use Docker volumes for data persistence

## Local Development (Without Docker)

1. Install dependencies for each service:
```bash
cd services/user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../../api-gateway && npm install
cd ../event-bus && npm install
```

2. Start PostgreSQL and Redis locally (using Docker):
```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=ecommerce -d postgres:16-alpine
docker run -p 6379:6379 -d redis:7-alpine
```

3. Create `.env` files in each service directory

4. Run services individually:
```bash
node services/user-service/index.js
node services/product-service/index.js
node services/order-service/index.js
node api-gateway/index.js
node event-bus/index.js
```

## Testing

### Example: Register User
```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Example: Login
```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Example: Create Product (requires auth header if added)
```bash
curl -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":99.99,"description":"A test product"}'
```

### Example: Create Order (requires auth)
```bash
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId":1,"productId":1}'
```

## Troubleshooting

### Services won't start
- Check if ports are already in use
- Ensure PostgreSQL and Redis are running and accessible
- Check logs: `docker-compose logs <service-name>`

### Database connection errors
- Verify DB credentials in `.env` or docker-compose environment
- Wait for PostgreSQL to be ready (healthcheck)
- Check network connectivity between containers

### JWT token errors
- Ensure `JWT_SECRET` is the same across services
- Check token hasn't expired
- Verify token format: `Bearer <token>`

## Project Structure

```
node-microservices-ecommerce/
├── api-gateway/          # API Gateway service
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── services/
│   ├── user-service/     # User management service
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── product-service/  # Product catalog service
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   └── order-service/    # Order processing service
│       ├── index.js
│       ├── package.json
│       └── Dockerfile
├── event-bus/            # Redis-based event bus
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── shared/               # Shared utilities
│   ├── db.js            # PostgreSQL connection
│   ├── logger.js        # Winston logger
│   └── validators.js    # Input validators
├── docker-compose.yml    # Orchestration
└── .env.example         # Environment template
```

## License

MIT
