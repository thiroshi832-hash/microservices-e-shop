# Production Deployment Guide

This guide covers deploying the e-commerce platform to production.

## Prerequisites

- Docker and Docker Compose installed on your server
- A domain name (optional but recommended)
- SSL certificates (for HTTPS)
- At least 2GB RAM and 2 CPU cores

## Environment Configuration

### 1. Update JWT Secret

Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

Update in `docker-compose.yml` and `frontend/.env`:
```yaml
environment:
  - JWT_SECRET=your-generated-secret-here
```

### 2. Database Configuration

The application uses Prisma ORM with PostgreSQL.

**Update database password** in `docker-compose.yml`:
```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

**Set DATABASE_URL** for each service (already in docker-compose):
```yaml
user-service:
  environment:
    - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/ecommerce
```

**Create `.env` file** in project root:
```env
POSTGRES_PASSWORD=your-secure-db-password
JWT_SECRET=your-jwt-secret
```

**Prisma migrations** are automatically applied on container startup via `npx prisma db push` in the Dockerfile. This creates/updates tables based on the Prisma schema.

### 3. Domain and SSL

Update nginx configuration in `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # ... rest of config
}
```

Mount SSL certificates in docker-compose:
```yaml
frontend:
  volumes:
    - ./ssl:/etc/ssl:ro
```

## Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network

  api-gateway:
    build: ./api-gateway
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_HOST=redis
    networks:
      - app-network

  user-service:
    build: ./services/user-service
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5001
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_HOST=redis
    networks:
      - app-network

  product-service:
    build: ./services/product-service
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5002
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - REDIS_HOST=redis
    networks:
      - app-network

  order-service:
    build: ./services/order-service
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5003
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - REDIS_HOST=redis
      - USER_SERVICE_URL=http://user-service:5001
      - PRODUCT_SERVICE_URL=http://product-service:5002
    networks:
      - app-network

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - VITE_API_URL=https://yourdomain.com
    volumes:
      - ./ssl:/etc/ssl:ro
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge

```

## Deployment Steps

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd node-microservices-ecommerce

# Copy production env file
cp .env.example .env
# Edit .env with production values

# Pull and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Initialize Database

The database schema is auto-created on service startup. To manually initialize:

```bash
# Access postgres container
docker-compose exec postgres psql -U postgres -d ecommerce

# Inside psql, verify tables
\dt
```

### 4. Set Up SSL (Let's Encrypt)

Use Certbot for free SSL certificates:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Update `frontend/nginx.conf` to use Let's Encrypt paths.

## Monitoring

### Health Checks

All services expose `/health` endpoints:

```bash
curl http://localhost:5000/health        # API Gateway
curl http://localhost:5001/health        # User Service
curl http://localhost:5002/health        # Product Service
curl http://localhost:5003/health        # Order Service
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f api-gateway
```

### Database Backup

Create backup script:

```bash
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres ecommerce > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

### Prisma Studio (Optional)

Access Prisma Studio to browse data:
```bash
docker-compose exec user-service npx prisma studio
# Opens http://localhost:5555
```

### Migration Strategy

The current setup uses `prisma db push` for schema synchronization, which is suitable for development and simple deployments.

For **production**, consider using Prisma Migrate for versioned migrations:

1. **Generate migration locally**:
```bash
cd services/user-service
npx prisma migrate dev --name init
```

2. **Commit migration files** (in `prisma/migrations/`)

3. **Apply in production**:
```bash
# Docker entrypoint script
npx prisma migrate deploy
```

Update Dockerfile CMD to:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
```

This ensures controlled, reversible schema changes.

## Scaling

### Horizontal Scaling

Scale service instances:

```bash
docker-compose up -d --scale product-service=3
```

API Gateway will distribute load across instances.

### Database Read Replicas

Add read replica to `docker-compose.prod.yml`:

```yaml
postgres-replica:
  image: postgres:16-alpine
  command: >
    postgres
    -c hot_standby=on
    -c wal_level=replica
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - replica_data:/var/lib/postgresql/data
  depends_on:
    - postgres
```

Configure product-service to read from replica.

## Updating Production

### Zero-Downtime Deploy

```bash
# Pull latest code
git pull origin main

# Rebuild and restart with new image
docker-compose -f docker-compose.prod.yml up -d --build

# Or use rolling update for multiple instances
docker-compose -f docker-compose.prod.yml up -d --no-deps --build product-service
```

### Rollback

```bash
# View previous images
docker images

# Roll back to previous image
docker-compose -f docker-compose.prod.yml up -d --no-deps --build product-service
```

## Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use strong PostgreSQL password (min 16 chars)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS with specific origins
- [ ] Set up firewall (allow only 80, 443)
- [ ] Regularly update Docker images
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up log rotation
- [ ] Use secrets manager for sensitive data
- [ ] Enable audit logging
- [ ] Configure rate limiting appropriately
- [ ] Set up intrusion detection
- [ ] Regular security patches

## Performance Optimization

### Frontend

- Enable gzip compression in nginx (already configured)
- Set appropriate cache headers
- Use CDN for static assets
- Optimize images before upload

### Backend

- Add Redis caching for frequent queries
- Use database connection pooling
- Implement query optimization
- Add indexes for slow queries
- Consider adding CDN for static assets

### Database

Regularly run:
```sql
VACUUM ANALYZE;
REINDEX DATABASE ecommerce;
```

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs -f

# Check container status
docker ps -a

# Restart specific service
docker-compose restart frontend
```

### Database connection refused

Ensure postgres is healthy:
```bash
docker-compose ps postgres
```

Check connection:
```bash
docker-compose exec postgres pg_isready
```

### High memory usage

Adjust Node.js memory limits in Dockerfiles:
```dockerfile
CMD ["node", "--max-old-space-size=256", "index.js"]
```

## Support

For issues, check:
1. Service logs: `docker-compose logs <service>`
2. Container stats: `docker stats`
3. Network: `docker network inspect node-microservices-ecommerce_default`
