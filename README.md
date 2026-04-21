# Node.js Microservices E-commerce Platform

A production-ready full-stack e-commerce platform built with microservices architecture, featuring a React TypeScript frontend and Node.js backend services.

## Architecture

```
┌──────────────┐
│  Frontend    │  ← React SPA (Port 80)
│   (React)    │  - Tailwind CSS
│   - Router   │  - React Query
└──────┬───────┘ - Protected routes
       │
       ▼
┌──────────────┐
│ API Gateway  │  ← Backend Entry (Port 5000)
│  (Express)   │  - Rate limiting
│   - Auth     │  - JWT validation
│   - Proxy    │  - Request logging
└──────┬───────┘
       │
┌──────┴────┬───────────────┐
│           │               │
▼           ▼               ▼
┌───────┐ ┌─────────┐  ┌──────────┐
│ Users │ │Products │  │ Orders   │
│ :5001 │ │  :5002  │  │  :5003   │
└───────┘ └─────────┘  └──────────┘
     │         │               │
     └────┬────┴───────────────┘
          │
     ┌────▼─────────┐
     │ PostgreSQL   │  ← Persistent Storage
     │   (Port 5432)│
     └──────────────┘
          │
     ┌────▼─────────┐
     │     Redis    │  ← Event Bus & Caching
     │   (Port 6379)│
     └──────────────┘
```

## Features

### Backend Features
- **ORM**: Prisma with auto-generated client, type-safe queries
- **Authentication & Authorization**: JWT-based auth with bcrypt password hashing
- **Service-to-Service Communication**: Secure internal communication with error handling
- **Event-Driven Architecture**: Redis Pub/Sub for events
- **Database**: PostgreSQL with Prisma ORM, auto-generated schema
- **API Gateway**: Centralized routing, rate limiting, Helmet security, request logging
- **Logging**: Winston structured logging with file rotation
- **Input Validation**: Joi validation on all endpoints
- **Docker**: Containerized deployment with health checks and dependencies

### Frontend Features
- **Modern React**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Context API for auth and cart
- **Data Fetching**: React Query for caching and synchronization
- **Routing**: React Router v6 with protected routes
- **Forms**: React Hook Form with validation
- **Notifications**: React Hot Toast for user feedback
- **Icons**: Lucide React icon set
- **Production Ready**: Optimized builds with Vite and Nginx

## Version Management

This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/) for automated version management.

### Release Process

```bash
# Check current version
cat package.json | grep version

# See commits since last release
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# Create release
npm run release:minor    # for new features
npm run release:patch    # for bug fixes only
npm run release:major    # for breaking changes

# Or specify exact version
npm run release:specified -- 1.2.3

# Push to remote (includes tags)
git push --follow-tags origin main
```

### Commit Message Format

```
type(scope): description

feat(products): add product search by category
fix(orders): resolve duplicate order creation bug
docs: update API documentation
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `build`, `ci`

**Breaking change** (MAJOR bump):
```
feat(auth)!: remove username from registration

BREAKING CHANGE: Username field removed, use email only
```

### Automated

- `npm run version` - Standard version bump based on commits
- `CHANGELOG.md` - Auto-generated from commit messages
- Git tags - Auto-created (`v1.2.3`)
- Pre-commit hooks - Enforce commit format

## Getting Started

### With Docker (Recommended)
```bash
docker-compose up --build
```
Visit http://localhost (frontend) or http://localhost:5000 (API)

### Without Docker

#### Backend
```bash
# Start PostgreSQL and Redis
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=ecommerce -d postgres:16-alpine
docker run -p 6379:6379 -d redis:7-alpine

# Install dependencies and start each service
cd services/user-service && npm install && node index.js
cd services/product-service && npm install && node index.js
cd services/order-service && npm install && node index.js
cd api-gateway && npm install && node index.js
cd event-bus && npm install && node index.js
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:3000

## Frontend Routes

The React frontend provides these pages:

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home page with featured products | No |
| `/products` | Product listing with filters | No |
| `/products/:id` | Product detail page | No |
| `/cart` | Shopping cart | No |
| `/login` | User login | No |
| `/register` | User registration | No |
| `/checkout` | Complete order | Yes |
| `/orders` | Order history | Yes |
| `/orders/:id` | Order details | Yes |
| `/profile` | User profile | Yes |

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

## Prisma ORM

All services use Prisma as the ORM for database operations:

- **Type-safe queries**: Full TypeScript support with autocompletion
- **Auto-generated client**: Prisma Client generated from schema
- **Migrations**: Database schema managed via Prisma Migrate or `db push`

### Schema Locations

Each service has its own Prisma schema:
- `services/user-service/prisma/schema.prisma` - User model
- `services/product-service/prisma/schema.prisma` - Product model
- `services/order-service/prisma/schema.prisma` - Order model

### Working with Prisma

#### Update Schema
Edit the `schema.prisma` file in the respective service.

#### Generate Client
```bash
cd services/user-service
npx prisma generate
```

#### Push Changes to Database
```bash
# Development (auto-migrate, may drop data)
npx prisma db push

# Production (use migrations)
npx prisma migrate dev --name init
```

#### View Database in Prisma Studio
```bash
cd services/user-service
npx prisma studio
# Opens http://localhost:5555
```

### Database URL

Prisma uses `DATABASE_URL` environment variable:
```
postgresql://user:password@host:port/database
```

This is set in `docker-compose.yml` and `.env` files.

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

### Backend Services

1. Install dependencies for each service:
```bash
cd services/user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../../api-gateway && npm install
cd ../event-bus && npm install
```

2. Start PostgreSQL and Redis:
```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=ecommerce -d postgres:16-alpine
docker run -p 6379:6379 -d redis:7-alpine
```

3. Create `.env` files in each service directory (copy from `.env.example`)

4. Generate Prisma client and push database schema:
```bash
cd services/user-service
npx prisma generate
npx prisma db push

cd ../product-service
npx prisma generate
npx prisma db push

cd ../order-service
npx prisma generate
npx prisma db push
```

5. Run services:
```bash
node services/user-service/index.js
node services/product-service/index.js
node services/order-service/index.js
node api-gateway/index.js
node event-bus/index.js
```

### Frontend Development

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000 and will proxy API requests to http://localhost:5000.

3. Build for production:
```bash
npm run build
```

## Testing

### Backend API Testing

### Example: Register User
```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'
```

### Example: Login
```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Example: Create Product (requires auth)
```bash
TOKEN=<your-token>
curl -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Product","price":99.99,"description":"A test product"}'
```

### Example: Create Order (requires auth)
```bash
TOKEN=<your-token>
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":1,"productId":1}'
```

### Frontend Testing

Run frontend tests:
```bash
cd frontend
npm test
```

Run tests with UI:
```bash
npm run test:ui
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
├── frontend/                  # React frontend (TypeScript + Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Auth, Cart)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   ├── types/            # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── api-gateway/              # API Gateway service
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── services/
│   ├── user-service/         # User management service
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Prisma schema (User model)
│   │   │   └── (migrations)  # Optional migrations
│   │   ├── prisma.js         # Prisma client instance
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── product-service/      # Product catalog service
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Prisma schema (Product model)
│   │   │   └── (migrations)
│   │   ├── prisma.js
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   └── order-service/        # Order processing service
│       ├── prisma/
│       │   ├── schema.prisma # Prisma schema (Order model)
│       │   └── (migrations)
│       ├── prisma.js
│       ├── index.js
│       ├── package.json
│       └── Dockerfile
├── event-bus/                # Redis event bus
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── shared/                   # Shared utilities
│   ├── logger.js            # Winston logger
│   └── validators.js        # Input validators
├── docker-compose.yml        # Orchestration
├── .env.example             # Environment template
├── README.md
├── CHANGELOG.md
├── GIT_WORKFLOW.md
├── DEPLOYMENT.md
├── Makefile
└── PROJECT_SUMMARY.md
```
node-microservices-ecommerce/
├── frontend/                  # React frontend (TypeScript + Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Auth, Cart)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   ├── types/            # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── api-gateway/              # API Gateway service
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── services/
│   ├── user-service/         # User management service
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── product-service/      # Product catalog service
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   └── order-service/        # Order processing service
│       ├── index.js
│       ├── package.json
│       └── Dockerfile
├── event-bus/                # Redis event bus
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── shared/                   # Shared utilities
│   ├── db.js                # PostgreSQL connection
│   ├── logger.js            # Winston logger
│   └── validators.js        # Input validators
├── docker-compose.yml        # Orchestration
├── .env.example             # Environment template
├── README.md
├── CHANGELOG.md
├── GIT_WORKFLOW.md
└── setup-dev.{sh,bat}       # Dev setup scripts
```

## License

MIT
