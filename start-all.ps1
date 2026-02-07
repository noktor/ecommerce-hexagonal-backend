# Script to start the entire project (Redis + Application)
# Run with: .\start-all.ps1

Write-Host "🚀 Starting project with Docker and Redis..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please:" -ForegroundColor Yellow
    Write-Host "   1. Open Docker Desktop" -ForegroundColor Yellow
    Write-Host "   2. Wait for the icon to appear in the taskbar" -ForegroundColor Yellow
    Write-Host "   3. Run this script again" -ForegroundColor Yellow
    exit 1
}

# Start Redis with docker-compose
Write-Host ""
Write-Host "🐳 Starting Redis with Docker Compose..." -ForegroundColor Cyan
docker-compose up -d redis

# Wait for Redis to be ready
Write-Host "⏳ Waiting for Redis to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$redisReady = $false

while ($attempt -lt $maxAttempts -and -not $redisReady) {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $result = docker exec redis redis-cli ping 2>&1
        if ($result -match "PONG") {
            $redisReady = $true
            Write-Host "✅ Redis is working!" -ForegroundColor Green
        }
    } catch {
        # Continue trying
    }
    if ($attempt % 5 -eq 0) {
        Write-Host "   Attempting connection... ($attempt/$maxAttempts)" -ForegroundColor Gray
    }
}

if (-not $redisReady) {
    Write-Host "⚠️  Redis is not responding yet, but continuing..." -ForegroundColor Yellow
}

# Check that npm is installed
Write-Host ""
Write-Host "📦 Checking Node.js and npm..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js or npm are not installed!" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "📥 Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Show status
Write-Host ""
Write-Host "📊 Service status:" -ForegroundColor Cyan
docker ps --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "🎯 Everything is ready! Starting the application..." -ForegroundColor Green
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Run the application
npm run dev

