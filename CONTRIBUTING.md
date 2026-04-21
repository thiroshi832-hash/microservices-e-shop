# Contribution Guidelines

Thank you for considering contributing to our e-commerce microservices platform! This document outlines the process for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Versioning & Releases](#versioning--releases)
- [Branching Strategy](#branching-strategy)
- [Commit Standards](#commit-standards)
- [Pull Request Process](#pull-request-process)
- [Code Review](#code-review)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a strict code of conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker & Docker Compose
- Git
- PostgreSQL (optional, for local dev without Docker)
- Redis (optional, for local dev without Docker)

### Initial Setup

```bash
# 1. Fork & clone
git clone https://github.com/yourusername/node-microservices-ecommerce.git
cd node-microservices-ecommerce

# 2. Install dependencies and setup hooks
npm run setup

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Start development
npm run dev
```

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing [issues](https://github.com/yourusername/repo/issues) to avoid duplicates
2. Ensure you're using the latest version
3. Collect relevant logs and error messages

Bug reports should include:
- **Environment**: Node version, OS, Docker version
- **Steps to reproduce**: Clear, minimal steps
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Screenshots/Logs**: If applicable

### Suggesting Features

Feature requests are welcome! Please:
1. Check if the feature already exists or has been requested
2. Describe the feature and the problem it solves
3. Consider if it fits the project scope (microservices e-commerce platform)

## Versioning & Releases

We use [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

### Release Types

| Release | Command | When |
|---------|---------|------|
| **Patch** | `npm run release:patch` | Bug fixes only (x.x.N → x.x.N+1) |
| **Minor** | `npm run release:minor` | New features (x.N.0 → x.N+1.0) |
| **Major** | `npm run release:major` | Breaking changes (N.x.x → N+1.0.0) |

### Version Scope

```
feat(service): description        → bump MINOR
fix(service): description         → bump PATCH
feat!           : description     → bump MAJOR (breaking change)
docs/chore/etc                      no bump
```

### Creating a Release (for maintainers)

```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Ensure all PRs merged

# 3. Bump version
npm run release:minor   # or :patch or :major

# 4. Push (creates tag and GitHub release)
git push --follow-tags
```

## Branching Strategy

We follow **GitHub Flow**:

```
main ────────────────────────▶ (production-ready)
  │
  ├── feature/amazing-feature ──▶ (merge via PR)
  ├── fix/critical-bug ─────────▶ (merge via PR)
  └── hotfix/urgent-fix ─────────▶ (emergency only)
```

### Branch Naming

- `feature/short-description` - New features
- `fix/issue-description` - Bug fixes
- `hotfix/urgent-issue` - Critical production fixes
- `docs/documentation-update` - Documentation only
- `refactor/component-name` - Code refactoring

**Examples**:
```
feature/user-authentication
fix/order-total-calculation
hotfix/payment-timeout
```

## Commit Standards

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/).

### Required Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Valid Types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `build`, `ci`

### Examples

✅ **Good**:
```
feat(user-service): add JWT refresh token endpoint

Implement refresh token functionality that allows users to
obtain new access tokens without re-authenticating.

BREAKING CHANGE: Old token format deprecated, migrate within 30 days.
```

✅ **Also good**:
```
fix(orders): prevent duplicate order creation
docs: update API endpoint examples
```

❌ **Bad**:
```
fixed bug
updated stuff
added login
```

### Breaking Changes

Add `BREAKING CHANGE:` in footer or use `!` after type:

```
feat(auth)!: change password hashing algorithm

BREAKING CHANGE: All passwords must be rehashed using new algorithm.
Migration script provided in /scripts/migrate-passwords.js.
```

### Commit Message Linter

Husky pre-commit hook validates commit messages automatically.

**To bypass** (use sparingly):
```bash
git commit -m "message" --no-verify
```

## Pull Request Process

### 1. Create Branch from Main

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

### 2. Make Changes

- Write clean, modular code
- Follow existing patterns and conventions
- Add tests for new functionality
- Update documentation if needed

### 3. Commit with Conventional Message

```bash
git add .
git commit -m "feat(products): add product filtering by price range"
```

### 4. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create Pull Request on GitHub with:
- Clear title (conventional commit format)
- Description explaining changes
- Reference related issues `Closes #123`
- Screenshots for UI changes

### 5. PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] New feature (non-breaking)
- [ ] Bug fix (non-breaking)
- [ ] Breaking change (requires major version bump)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Tested locally with Docker

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] No console.log statements
- [ ] Updated documentation
- [ ] All tests pass
```

## Code Review

### For Reviewers

1. **Understand the change**: Read PR description, check related issues
2. **Run the code**: Test locally if possible
3. **Review for**:
   - Correctness & edge cases
   - Security implications
   - Performance impact
   - Code readability & maintainability
   - Test coverage
   - Adherence to conventions

4. **Provide constructive feedback**:
   - Be specific and suggest alternatives
   - Ask questions, don't just criticize
   - Praise good code!

### For Authors

- Respond to all comments
- Make requested changes or explain why not
- Don't merge your own PR unless you're a maintainer
- Keep PRs small (max ~300 lines) for easier review

## Testing

### Backend Services

```bash
# Run all services with Docker
npm run dev

# Test API endpoints
curl http://localhost:5000/health
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'
```

### Frontend Tests

```bash
cd frontend
npm test          # Run all tests
npm run test:ui   # Interactive test runner
npm run test:coverage  # With coverage report
```

### Linting

```bash
# Install ESLint in services (optional)
npm install eslint --save-dev

# Run linter
npx eslint .
```

**Note**: Linting not yet enforced but recommended.

## Documentation

Update documentation when changing functionality:

- `README.md` - User-facing documentation
- `VERSIONING.md` - For version management
- `DEPLOYMENT.md` - For production setup
- `services/*/README.md` (create if needed) - Service-specific docs
- Code comments: Explain complex logic, not obvious code

### Doc Changes in PRs

- Include doc updates in same PR as code changes
- Update relevant section only
- Use clear, concise language
- Add examples where helpful

## Release Process (Maintainers Only)

1. Verify all tests pass
2. Ensure CHANGELOG is up-to-date
3. Check commit messages follow conventional format
4. Run `npm run release:version-type`
5. Push tags: `git push --follow-tags`
6. Verify GitHub release created automatically
7. Update Docker images (optional):
   ```bash
   docker build -t yourusername/frontend:v1.2.3 frontend/
   docker push yourusername/frontend:v1.2.3
   ```
8. Announce release

## Getting Help

- **Documentation**: Start with README.md, VERSIONING.md, DEPLOYMENT.md
- **Issues**: Search existing issues or create new one
- **Discussions**: Use GitHub Discussions for questions
- **Chat**: (Optional - add Slack/Discord link)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Happy Contributing! 🎉**
