# Release Management & Versioning

Complete guide for managing versions and releases using conventional commits and automated tools.

## 📦 Current Version

**Project Version**: 1.0.0  
**Last Release**: 2025-04-22  
**Git Tags**: `v1.0.0`, `v1.0.1`, etc.

## 🏷️ Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH (e.g., 1.2.3)

- MAJOR: Breaking changes (incompatible API changes)
- MINOR: New features (backwards-compatible)
- PATCH: Bug fixes (backwards-compatible)
```

### Examples

```
1.0.0 → 1.1.0   Added new product filtering feature
1.1.0 → 1.1.1   Fixed login bug
1.1.1 → 2.0.0   Changed authentication flow (breaking)
```

## 📝 Conventional Commits

Every commit must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Commit Types & Version Impact

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | MINOR | `feat(products): add category filter` |
| `fix` | Bug fix | PATCH | `fix(orders): resolve duplicate order bug` |
| `docs` | Documentation | None | `docs: update API reference` |
| `style` | Formatting only | None | `style: fix indentation` |
| `refactor` | Code restructuring | None | `refactor(user): simplify login logic` |
| `perf` | Performance improvement | PATCH | `perf(api): optimize query performance` |
| `test` | Add/update tests | None | `test: add unit tests for auth` |
| `chore` | Maintenance tasks | None | `chore: update dependencies` |
| `revert` | Revert previous commit | Depends | `revert: rollback auth changes` |
| `build` | Build system changes | None | `build: update Dockerfile` |
| `ci` | CI/CD changes | None | `ci: add GitHub Actions workflow` |

### Breaking Changes

Indicate breaking changes with `!` after type/scope:

```
feat(auth)!: remove username field from registration

BREAKING CHANGE: The registration endpoint no longer accepts `username`.
Use `email` only for authentication.
```

This triggers a **MAJOR** version bump.

### Scope (Optional but Recommended)

Scope indicates which service/component the change affects:

```
feat(user-service): add JWT refresh tokens
fix(product-service): resolve category filter bug
docs(api-gateway): update rate limit docs
```

Valid scopes (based on your services):
- `user-service`
- `product-service`
- `order-service`
- `api-gateway`
- `event-bus`
- `frontend`
- `shared`
- `docker`
- `ci`
- (empty for cross-service changes)

## 🎯 Git Workflow for Releases

### 1. Development Cycle

```bash
# Start from main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "feat(products): add product search by category"

# Push and create PR
git push origin feature/amazing-feature
# Create PR on GitHub
```

### 2. Before Release

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# See what commits will be included
git log --oneline $(git describe --tags --abbrev=0 || echo "HEAD~10")..HEAD

# Dry run release (see what will change)
npx standard-version --dry-run
```

### 3. Create Release

```bash
# Standard release (auto-detect version bump)
npm run version

# OR specify version manually
npm run release:major    # Bump to next major (1.0.0 → 2.0.0)
npm run release:minor    # Bump to next minor (1.0.0 → 1.1.0)
npm run release:patch    # Bump patch (1.0.0 → 1.0.1)
npm run release:specified -- 2.1.0  # Specific version

# This will:
# 1. Analyze commits since last tag
# 2. Bump version in relevant package.json files
# 3. Update CHANGELOG.md
# 4. Commit changes: "chore(release): 1.1.0"
# 5. Create git tag: v1.1.0

# Push to remote
git push --follow-tags origin main
```

### 4. After Release

```bash
# Create GitHub release (auto from tag push if using GH Actions)
# Or manually: https://github.com/yourusername/repo/releases

# Start next development cycle
git checkout -b feature/next-feature
```

## 🔧 Commands Reference

### Version Management

```bash
# See current versions
cat package.json | grep version
lerna list --all  # If using lerna

# Check commits since last release
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# Preview release (dry-run)
npx standard-version --dry-run

# Create release (interactive)
npm run version
# Will ask: "Which branch to bump? [main]"
```

### Automated Version Bumping

```bash
# Bump based on commit types
npm run release:major   # breaking changes (feat!, fix!)
npm run release:minor   # new features (feat)
npm run release:patch   # bug fixes only (fix)

# OR specify exact version
npm run release:specified -- 1.2.3
```

### Changelog Management

```bash
# Standard-version auto-updates CHANGELOG.md
# To manually edit, edit the file directly under "## [Unreleased]" section

# Preview changelog
npx standard-version --dry-run

# View unreleased changes
git log --oneline --no-merges $(git describe --tags --abbrev=0)..HEAD
```

### Tag Management

```bash
# List all tags
git tag -l

# Show tag details
git show v1.0.0

# Delete tag (local & remote)
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Checkout specific release
git checkout v1.0.0
```

## 📊 Multi-Package Versioning

Since this is a monorepo with multiple `package.json` files, we need to manage versions across packages.

### Current Strategy

- **Frontend**: Independent version (managed by standard-version via `.versionrc.json`)
- **Backend Services**: Manual version updates or use Lerna
- **Monorepo**: Root `package.json` version serves as umbrella version

### Using Lerna for Unified Versioning

If you want all packages on same version:

```bash
# Install lerna globally
npm install -g lerna

# Initialize (if not done)
lerna init

# Version all packages together
lerna version patch   # bumps all to x.x.N+1
lerna version minor   # bumps all to x.N+1.0
lerna version major   # bumps all to N+1.0.0

# This will:
# - Update version in all package.json files
# - Create commit with all changes
# - Create git tag
# - Optionally publish to npm

# Lerna mode: "independent" or "fixed"
# In lerna.json: "version": "independent"  # each package can have own version
#                "version": "fixed"         # all packages share same version
```

## 🚀 Continuous Integration (GitHub Actions)

Create `.github/workflows/release.yml` for automated releases:

```yaml
name: Release

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, 'chore(release)')"

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci

      - name: Run tests
        run: npm test

      - name: Create release
        if: github.ref == 'refs/heads/main'
        run: npx standard-version

      - name: Push changes
        if: github.ref == 'refs/heads/main'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git push --follow-tags origin main
```

## 📋 Pre-commit Hooks (Husky)

We use **Husky** to enforce commit message format:

### Already Configured

- `.husky/commit-msg`: Runs `commitlint` on every commit message

### Commit Message Validation

```bash
# Test commit message format
echo "feat(test): message" | npx commitlint
```

### Skip Hook (Emergency Only)

```bash
git commit -m "your message" --no-verify
```

## 🔍 Version Decision Tree

```
Is this a breaking change?
  ├─ YES → Use `feat!` or `fix!` → MAJOR version
  └─ NO
       ├─ New feature? → `feat` → MINOR version
       ├─ Bug fix? → `fix` → PATCH version
       └─ Other? → No version bump
```

## 📈 Version History

Track versions in `CHANGELOG.md`:

```markdown
## [1.1.0] - 2025-04-22

### Added
- Product search by category (feat(products))
- User profile page (feat(frontend))

### Fixed
- Duplicate order bug (fix(orders))

## [1.0.0] - 2025-04-20

### Added
- Initial release
- User authentication
- Product catalog
- Order management
```

## 🐛 Hotfixes

For critical production bugs:

```bash
# Create hotfix branch from main (or specific tag)
git checkout main
git checkout -b hotfix/critical-bug

# Fix the bug
git commit -m "fix(orders): resolve payment timeout issue"

# Release immediately (patch bump)
npm run release:patch

# Push and deploy
git push --follow-tags origin main
git checkout main
git merge hotfix/critical-bug
```

## 📦 Docker Tags

After version release, update Docker images:

```bash
# Tag with version
docker tag ecommerce-frontend:latest ecommerce-frontend:v1.1.0

# Push to registry
docker push yourusername/ecommerce-frontend:v1.1.0
docker push yourusername/ecommerce-frontend:latest

# Update docker-compose.yml if needed
```

## 🎯 Best Practices

1. **Always write conventional commits** - automation depends on it
2. **Group related changes** in single commits
3. **Don't mix types** in one commit (separate feat and fix)
4. **Test before releasing** - run `npm test`
5. **Update CHANGELOG manually** if important context missing
6. **Use feature branches** - never commit directly to main
7. **Keep releases small** - easier to rollback
8. **Tag every release** - required for version detection

## 🛠️ Troubleshooting

### "No commits found since last release"
Standard-version didn't find any version-triggering commits. Options:
- Add proper conventional commit messages
- Force version: `npm run release:specified -- 1.1.0`

### "Commit message does not conform to conventional commits"
Fix your commit message:
```bash
git commit --amend -m "feat(service): proper format"
```

### Need to change version after tagging?
```bash
# Delete tag (local & remote)
git tag -d v1.0.0
git push origin :v1.0.0

# Reset to previous commit and re-release
git reset --hard HEAD~1
npm run release:minor  # or whatever version
```

### Multiple packages need different versions?
Switch to Lerna independent mode:
```json
// lerna.json
{
  "version": "independent"
}
```

## 📚 Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [Husky](https://typicode.github.io/husky/)
- [Commitlint](https://commitlint.js.org/)
- [Lerna](https://lerna.js.org/)

## 🆘 Quick Commands

```bash
# Initial setup (once)
npm install
npx husky install

# Day-to-day
git checkout -b feature/name
git commit -m "feat(service): description"
git push origin feature/name

# Release
git checkout main && git pull
npm run release:minor   # or major/patch
git push --follow-tags

# Hotfix
git checkout -b hotfix/name
# fix bug
npm run release:patch
git push --follow-tags
```

---

**With this workflow, every release is automatic, documented, and traceable!**
