@echo off
REM Development setup script for Windows

echo Setting up development environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker first.
    exit /b 1
)

REM Create .env files from examples
echo Creating .env files...
copy .env.example .env >nul 2>&1

REM Install dependencies for all services
echo Installing dependencies...
cd api-gateway
call npm install
cd ..\services\user-service
call npm install
cd ..\..\..
cd services\product-service
call npm install
cd ..\..\..
cd services\order-service
call npm install
cd ..\..\..
cd event-bus
call npm install
cd ..

echo.
echo Development setup complete!
echo.
echo To start the project:
echo   docker-compose up --build
echo.
echo Services will be available at:
echo   API Gateway:    http://localhost:5000
echo   User Service:   http://localhost:5001
echo   Product Service: http://localhost:5002
echo   Order Service:  http://localhost:5003
echo   PostgreSQL:     localhost:5432
echo   Redis:          localhost:6379
echo.
echo To test authentication:
echo   1. Register: curl -X POST http://localhost:5000/users/register -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test@test.com\",\"password\":\"password123\"}"
echo   2. Login: curl -X POST http://localhost:5000/users/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"
echo   3. Use token: curl -H "Authorization: Bearer TOKEN" http://localhost:5000/orders
