@echo off
REM Post-install setup script for Windows

echo 🚀 Setting up development environment...

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Install Husky hooks
echo 🔗 Setting up Git hooks with Husky...
call npx husky install

REM Create commit-msg hook if not exists
if not exist ".husky\commit-msg" (
    echo 📝 Creating commit-msg hook...
    call npx husky add .husky\commit-msg "npx commitlint --edit %%1"
)

REM Create .env if not exists
if not exist ".env" (
    echo 📋 Creating .env file...
    copy .env.example .env > nul
)

echo.
echo ✅ Setup complete!
echo.
echo 📖 Next steps:
echo   1. Configure .env with your database credentials
echo   2. Start services: npm run dev
echo   3. For versioning: npm run version
echo.
echo 📚 Documentation:
echo   - VERSIONING.md - How to manage versions
echo   - GIT_WORKFLOW.md - Git best practices
echo   - DEPLOYMENT.md - Production deployment
pause
