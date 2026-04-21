#!/bin/bash

# Post-install script to set up Git hooks and versioning tools
# Run this after cloning: npm run setup

set -e

echo "🚀 Setting up development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Husky hooks
echo "🔗 Setting up Git hooks with Husky..."
npx husky install

# Create commit-msg hook if not exists
if [ ! -f .husky/commit-msg ]; then
  echo "📝 Creating commit-msg hook..."
  npx husky add .husky/commit-msg "npx commitlint --edit \$1"
fi

# Generate Prisma clients
echo "🗄️  Generating Prisma clients..."
npm run prisma:generate 2>/dev/null || true

# Create .env files if not exist
if [ ! -f .env ]; then
  echo "📋 Creating .env file..."
  cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "  1. Configure .env with your database credentials"
echo "  2. Start services: npm run dev"
echo "  3. For versioning: npm run version"
echo ""
echo "📚 Documentation:"
echo "  - VERSIONING.md - How to manage versions"
echo "  - GIT_WORKFLOW.md - Git best practices"
echo "  - DEPLOYMENT.md - Production deployment"
