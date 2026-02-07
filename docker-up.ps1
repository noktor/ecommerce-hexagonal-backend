# Script to start everything with Docker Compose
Write-Host "🐳 Starting project with Docker Compose..." -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $null = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not responding"
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Error: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Solution:" -ForegroundColor Yellow
    Write-Host "   1. Open Docker Desktop from the start menu" -ForegroundColor White
    Write-Host "   2. Wait for the Docker icon to appear in the taskbar" -ForegroundColor White
    Write-Host "   3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or run manually:" -ForegroundColor Yellow
    Write-Host "   docker-compose up --build -d" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Check docker-compose
Write-Host "🔍 Checking docker-compose..." -ForegroundColor Yellow
try {
    $null = docker-compose version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "docker-compose not available"
    }
    Write-Host "✅ docker-compose available" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: docker-compose is not available!" -ForegroundColor Red
    Write-Host "   Try with: docker compose up --build -d" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Building and starting services..." -ForegroundColor Cyan

# Try with docker-compose first, if it fails try with docker compose
try {
    docker-compose up --build -d
    if ($LASTEXITCODE -ne 0) {
        throw "docker-compose failed"
    }
} catch {
    Write-Host "   Trying with 'docker compose' (new version)..." -ForegroundColor Yellow
    docker compose up --build -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Error starting services!" -ForegroundColor Red
        Write-Host "   Verify that Docker Desktop is fully started." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📋 Application logs:" -ForegroundColor Cyan
Write-Host "   To view logs: docker-compose logs -f app" -ForegroundColor Yellow
Write-Host "   To stop: docker-compose down" -ForegroundColor Yellow
Write-Host ""

# Show initial logs
docker-compose logs --tail=50 app

