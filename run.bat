@echo off
echo ====================================================================
echo   EMERGENCY REQUEST ^& DISPATCH MANAGEMENT SYSTEM - STARTUP
echo ====================================================================
echo.

if "%1"=="docker" goto docker_mode

echo Starting with Docker Compose...
docker-compose up --build
goto end

:docker_mode
docker-compose up --build

:end
