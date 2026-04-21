# Git Workflow Guide

## Repository Structure

This project follows a microservices architecture with each service in its own directory:

```
node-microservices-ecommerce/
├── api-gateway/          # API Gateway service
├── services/
│   ├── user-service/     # User management
│   ├── product-service/  # Product catalog
│   └── order-service/    # Order processing
├── event-bus/            # Redis event bus
├── shared/               # Shared utilities (db, logger, validators)
├── docker-compose.yml    # Orchestration
└── README.md            # Project documentation
```

## Branching Strategy

We recommend using **Git Flow** or **GitHub Flow** for this project:

### Main Branches
- `main` (or `master`) - Production-ready code
- `develop` - Integration branch for features (optional)

### Feature Branches
- Create feature branches from `develop` or `main`:
  ```bash
  git checkout -b feature/user-authentication
  git checkout -b feature/product-search
  git checkout -b fix/order-bug
  ```

## Commit Convention

Follow **Conventional Commits** format:
```
type(scope): description

[optional body]

[optional footer]
```

**Required Types**:
- `feat`: New feature (triggers MINOR version)
- `fix`: Bug fix (triggers PATCH version)
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code restructuring (no new feature/bug)
- `perf`: Performance improvements
- `test`: Add or update tests
- `chore`: Maintenance tasks, dependency updates
- `revert`: Revert a previous commit
- `build`: Build system changes
- `ci`: CI/CD changes

**Breaking changes**: Add `!` after type/scope to indicate MAJOR version bump:
```
feat(auth)!: remove username field

BREAKING CHANGE: Username removed from registration, use email only.
```

Examples:
```bash
feat(products): add category filtering
fix(orders): resolve order duplication bug
docs: update installation guide
```

**Scope** (optional): Service name or component affected:
- `user-service`, `product-service`, `order-service`
- `api-gateway`, `event-bus`, `frontend`
- `shared`, `docker`, `ci`
- revert: revert previous commit
```

Example:
```bash
git commit -m "feat(auth): add JWT refresh token endpoint"
git commit -m "fix(order): resolve duplicate order creation bug"
```

## Development Workflow

### 1. Starting New Work
```bash
# Make sure you're on the latest main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Making Changes
```bash
# Make your changes to files...

# Check status
git status

# Stage specific files
git add services/user-service/index.js
git add shared/db.js

# Or stage all changes
git add .

# Commit with descriptive message
git commit -m "feat(auth): add role-based access control middleware"
```

### 3. Keep Updated with Main
```bash
# Rebase onto latest main to avoid merge conflicts
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main
```

### 4. Push and Create Pull Request
```bash
# Push your feature branch
git push origin feature/your-feature-name

# Then create Pull Request on GitHub/GitLab/Bitbucket
```

### 5. Merge and Clean Up
```bash
# After PR is approved and merged
git checkout main
git pull origin main
git branch -d feature/your-feature-name  # delete local branch
```

## Automated Version Management

This project uses automated version management with **standard-version**, **commitlint**, and **Husky**.

### Tools Setup

All tools are pre-configured:
- **commitlint**: Validates commit message format
- **Husky**: Git hooks manager (runs commitlint before commits)
- **standard-version**: Automates version bumping and changelog generation

### Enabling Husky Hooks

```bash
# Install dependencies (includes dev dependencies)
npm install

# Activate Husky (creates .husky/ directory)
npx husky install

# Hooks are automatically installed via prepare script
# commit-msg hook validates all commit messages
```

### Version Commands

```bash
# See what would be released (dry-run)
npx standard-version --dry-run

# Create release (auto-detect version bump)
npm run version

# Explicit version bumps
npm run release:patch    # 1.0.0 → 1.0.1
npm run release:minor    # 1.0.0 → 1.1.0
npm run release:major    # 1.0.0 → 2.0.0

# Specific version
npm run release:specified -- 2.0.0

# Push with tags
git push --follow-tags origin main
```

### What standard-version Does

1. Reads commit messages since last tag
2. Determines version bump (major/minor/patch) based on commit types
3. Updates `package.json` versions (frontend and optionally others)
4. Generates/updates `CHANGELOG.md`
5. Commits changes with `chore(release): x.x.x`
6. Creates Git tag `vx.x.x`

### Pre-commit Validation

Husky automatically validates commit messages:
```
❌ "fixed bug"           → rejected
✅ "fix(orders): prevent duplicate orders" → accepted
```

**Bypass hook** (emergency only):
```bash
git commit -m "message" --no-verify
```

## Important: .gitignore

**DO NOT commit:**
- `node_modules/` - Dependencies are rebuilt per environment
- `.env` files - Contains secrets (commit `.env.example` instead)
- `*.log` files - Log files should be generated at runtime
- Docker volumes - Database data should be ephemeral
- Build artifacts - Rebuilt on each deployment

**DO commit:**
- All source code
- Dockerfiles
- docker-compose.yml
- package.json and package-lock.json
- .env.example (template without secrets)

## Working with Multiple Services

### Testing Changes Across Services
1. Start all services with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Test API Gateway endpoints:
   ```bash
   # Register user
   curl -X POST http://localhost:5000/users/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@test.com","password":"password123"}'

   # Login
   curl -X POST http://localhost:5000/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

3. View logs:
   ```bash
   docker-compose logs -f user-service
   docker-compose logs -f api-gateway
   ```

### Making Atomic Commits
Each commit should represent a single logical change:
- **GOOD**: `fix(order): handle missing user error`
- **BAD**: `fix order bug and update readme and add logging`

## Security Best Practices

1. **Never commit secrets**:
   - JWT_SECRET
   - Database passwords
   - API keys

2. **Rotate credentials** before committing if accidentally exposed:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```

3. Use strong JWT secret in production:
   ```bash
   # Generate strong secret
   openssl rand -base64 32
   ```

## Tagging Releases

Create annotated tags for production releases:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin --tags
```

## Handling Merge Conflicts

If conflicts arise during `git pull` or `git rebase`:

1. **Identify conflicted files**:
   ```bash
   git status
   ```

2. **Resolve conflicts manually** (files will have `<<<<<<<` markers)

3. **Stage resolved files**:
   ```bash
   git add <resolved-file>
   ```

4. **Continue rebase**:
   ```bash
   git rebase --continue
   ```

## Useful Git Commands

```bash
# View commit history
git log --oneline --graph --decorate

# See changes before committing
git diff

# Unstage files
git reset HEAD <file>

# Amend last commit (use with caution, don't amend pushed commits)
git commit --amend

# Stash changes temporarily
git stash
git stash pop

# Discard local changes
git checkout -- <file>

# See who changed what
git blame <file>

# Find when something changed
git log -p <file>
```

## Pre-commit Hooks (Optional)

Install Husky for pre-commit hooks:

```bash
cd api-gateway && npm install husky --save-dev && npx husky install && cd ../..
# Repeat for each service, or add to root package.json
```

Example pre-commit hooks:
- Run linter
- Run tests
- Check for console.log statements
- Validate JSON/YAML files

## Continuous Integration

Configure CI/CD (GitHub Actions, GitLab CI, Jenkins):

Example `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## Troubleshooting

### "Repository is in detached HEAD state"
```bash
git checkout main
```

### "Failed to push" (non-fast-forward)
```bash
git pull --rebase origin main
# Resolve conflicts if any
git push origin main
```

### Undo last commit (not pushed)
```bash
git reset --soft HEAD~1
```

### Remove untracked files
```bash
git clean -fd
```

## Resources

- [Pro Git Book](https://git-scm.com/book/en/v2)
- [GitHub Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Conventional Commits](https://www.conventionalcommits.org/)
