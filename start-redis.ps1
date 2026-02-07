# Script to start Redis with Docker
# Run with: .\start-redis.ps1

Write-Host "🐳 Starting Redis with Docker..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if Redis container already exists
$redisExists = docker ps -a --filter "name=redis" --format "{{.Names}}" | Select-String "redis"

if ($redisExists) {
    Write-Host "📦 Redis container found, starting..." -ForegroundColor Yellow
    docker start redis
} else {
    Write-Host "📦 Creating and starting Redis container..." -ForegroundColor Yellow
    docker run -d -p 6379:6379 --name redis redis:latest
}

# Wait a bit for Redis to start
Start-Sleep -Seconds 2

# Verify that Redis works
Write-Host "🔍 Checking Redis connection..." -ForegroundColor Cyan
$result = docker exec redis redis-cli ping 2>&1

if ($result -match "PONG") {
    Write-Host "✅ Redis is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Container information:" -ForegroundColor Cyan
    docker ps --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""
    Write-Host "🚀 Now you can run: npm run dev" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis has started but is not responding yet. Wait a few seconds and try:" -ForegroundColor Yellow
    Write-Host "   docker exec redis redis-cli ping" -ForegroundColor Yellow
}

