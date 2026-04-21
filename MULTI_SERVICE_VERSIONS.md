# Multi-Service Version Management

This document explains how versions are managed across multiple microservices in this monorepo.

## 📊 Current Versions

| Service | Version | Location |
|---------|---------|----------|
| **User Service** | 1.0.0 | services/user-service/package.json |
| **Product Service** | 1.0.0 | services/product-service/package.json |
| **Order Service** | 1.0.0 | services/order-service/package.json |
| **API Gateway** | 1.0.0 | api-gateway/package.json |
| **Event Bus** | 1.0.0 | event-bus/package.json |
| **Frontend** | 1.0.0 | frontend/package.json |
| **Monorepo** | 1.0.0 | package.json (root) |

## 🔄 Version Synchronization Strategy

### Current Approach: Independent Versions

Each service has its own `package.json` version and can be released independently. This is suitable because:
- Services can be deployed independently
- Backward compatibility is maintained at API level
- Frontend can have separate release cadence

**Pros**:
- Flexibility to release services independently
- Decoupled deployment cycles
- Clear ownership per service

**Cons**:
- Multiple versions to track
- Potential version mismatches

### Alternative: Unified Versioning

All services share the same version number (managed by Lerna):

```bash
lerna version patch   # bumps all packages to same version
```

To enable:
1. Edit `lerna.json`: `"version": "fixed"`
2. Use `lerna version` instead of `standard-version`

**Pros**:
- Single source of truth
- Easier to know which versions are compatible

**Cons**:
- Forces all services to release together
- Less flexibility

## 🎯 Version Bumping Process

### Scenario 1: Breaking change in User Service

```bash
# Commit message:
git commit -m "feat(user-service)!: change password hashing algorithm (BREAKING)"

# Release major version
npm run release:major
# → Updates all package.json major versions
# → Creates tag v2.0.0
```

### Scenario 2: New feature in Product Service

```bash
git commit -m "feat(product-service): add product search by SKU"
npm run release:minor
# → 1.1.0 for all packages (or independent if configured)
```

### Scenario 3: Bug fix in Order Service only

```bash
git commit -m "fix(order-service): fix order total calculation"
npm run release:patch
# → 1.0.1 for all packages
```

## 🔧 Updating Versions Manually

If you need to manually bump a specific service version:

```bash
# Update package.json in that service
cd services/user-service
npm version patch  # 1.0.0 → 1.0.1
# or
npm version minor  # 1.0.0 → 1.1.0

# Commit and tag
git add package.json
git commit -m "chore(user-service): bump version to 1.0.1"
git tag v1.0.1-user-service
git push --follow-tags
```

## 📋 Version Check Script

Add `scripts/check-versions.sh`:

```bash
#!/bin/bash
# Check all package versions are aligned

echo "Checking versions across services..."
VERSIONS=$(grep '"version"' services/*/package.json frontend/package.json 2>/dev/null | sort -u)

echo "$VERSIONS"
echo ""

UNIQUE=$(echo "$VERSIONS" | wc -l)
if [ "$UNIQUE" -gt 1 ]; then
  echo "⚠️  Warning: Multiple versions detected!"
  exit 1
else
  echo "✅ All services share same version"
fi
```

## 🏷️ Tag Naming Convention

Tags follow pattern: `v{version}`

Examples:
- `v1.0.0` - Initial release
- `v1.0.1` - Bug fix patch
- `v1.1.0` - Minor feature
- `v2.0.0` - Major breaking change

**Service-specific tags** (if using independent versions):
- `user-service-v1.0.0`
- `product-service-v1.0.0`
- `frontend-v1.0.0`

## 🚀 Docker Image Tags

When releasing, also update Docker image tags:

```bash
# After git tag push
docker build -t yourname/ecommerce-frontend:v1.1.0 frontend/
docker build -t yourname/ecommerce-user-service:v1.1.0 services/user-service/
# ... etc

# Also tag as latest
docker tag yourname/ecommerce-frontend:v1.1.0 yourname/ecommerce-frontend:latest
```

Update `docker-compose.yml` to use versioned images for production:
```yaml
frontend:
  image: yourname/ecommerce-frontend:v1.1.0
```

## 📈 Release Checklist

- [ ] All tests pass (`npm test`)
- [ ] No console.log statements in code
- [ ] Documentation updated (README, CHANGELOG)
- [ ] no breaking changes OR breaking changes clearly marked
- [ ] Docker images built and pushed (production)
- [ ] Database migrations tested
- [ ] Monitoring/alerting updated
- [ ] Team notified of release

## 🔍 Version Audit

Before release, verify:

```bash
# Check for version conflicts
git diff main -- services/*/package.json frontend/package.json

# See commits to be released
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")..HEAD

# Preview changelog
npx standard-version --dry-run
```

## 📚 Additional Resources

- `VERSIONING.md` - Detailed versioning workflow
- `CONTRIBUTING.md` - How to contribute
- `GIT_WORKFLOW.md` - Git best practices
- `DEPLOYMENT.md` - Production deployment

## ❓ FAQ

### Q: How do I release a hotfix without including unreleased features?

Use a hotfix branch from the latest tag:
```bash
git checkout v1.1.0
git checkout -b hotfix/critical-issue
# Fix...
npm run release:patch
```

### Q: Can I release only the frontend?

Yes, with independent versions:
```bash
cd frontend
npm version patch   # only bumps frontend
cd ../..
git add frontend/package.json
git commit -m "chore(frontend): v1.0.1"
git tag frontend-v1.0.1
```

### Q: How do I rollback a release?

```bash
# Find the previous tag
git tag -l

# Revert to previous release
git revert <bad-tag-commit>..HEAD
git push origin main

# Or force reset (dangerous - only if not deployed)
git reset --hard <previous-tag>
git push --force origin main
```

---

**This multi-service versioning strategy ensures smooth, independent releases while maintaining system compatibility.**
