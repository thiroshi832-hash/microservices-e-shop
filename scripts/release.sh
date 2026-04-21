#!/bin/bash

# Automated release script for monorepo
# This script bumps versions across all services using conventional commits

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting release process...${NC}"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  You are on branch '$CURRENT_BRANCH', not 'main'${NC}"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
  exit 1
fi

# Pull latest changes
echo -e "${GREEN}📥 Pulling latest changes from origin...${NC}"
git pull origin main

# Determine version bump type
echo -e "${GREEN}🔍 Analyzing commits since last tag...${NC}"

# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  LAST_TAG="v0.0.0"
fi

echo -e "${YELLOW}Last tag: $LAST_TAG${NC}"

# Show commits since last tag
echo -e "${GREEN}📝 Commits since $LAST_TAG:${NC}"
git log --oneline --no-merges ${LAST_TAG}..HEAD

# Determine version bump
if git log --oneline --no-merges ${LAST_TAG}..HEAD | grep -q "feat!"; then
  BUMP="major"
elif git log --oneline --no-merges ${LAST_TAG}..HEAD | grep -q "fix!"; then
  BUMP="major"
elif git log --oneline --no-merges ${LAST_TAG}..HEAD | grep -q "^feat"; then
  BUMP="minor"
elif git log --oneline --no-merges ${LAST_TAG}..HEAD | grep -q "^fix"; then
  BUMP="patch"
else
  BUMP="none"
fi

if [ "$BUMP" = "none" ]; then
  echo -e "${YELLOW}ℹ️  No version-triggering commits found (only docs, style, chore, etc.)${NC}"
  read -p "Do you still want to create a release? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
  BUMP="patch"
fi

echo -e "${GREEN}📊 Planned version bump: $BUMP${NC}"

# Run standard-version
echo -e "${GREEN}🏷️  Running standard-version...${NC}"

if [ "$BUMP" = "major" ]; then
  npx standard-version --release-as major
elif [ "$BUMP" = "minor" ]; then
  npx standard-version --release-as minor
else
  npx standard-version
fi

# Show what changed
echo -e "${GREEN}✅ Version bump complete!${NC}"
echo -e "${GREEN}📝 New version in package.json files:${NC}"
grep '"version"' package.json services/*/package.json frontend/package.json 2>/dev/null | head -10 || true

# Commit version changes
echo -e "${GREEN}💾 Committing version changes...${NC}"
git add -A
git commit -m "chore(release): $BUMP version bump"

# Create and push tag
echo -e "${GREEN}🏷️  Pushing tags to remote...${NC}"
git push --follow-tags origin main

echo -e "${GREEN}✨ Release complete!${NC}"
echo -e "${GREEN}🎯 Next steps:${NC}"
echo -e "  1. Verify release on GitHub: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases"
echo -e "  2. Update deployment (if applicable)"
echo -e "  3. Notify team"
