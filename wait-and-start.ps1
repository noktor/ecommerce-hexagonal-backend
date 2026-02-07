# Wait for Docker to be available and then start everything

Write-Host "⏳ Waiting for Docker Desktop to start..." -ForegroundColor Yellow
Write-Host "   (This may take 30-60 seconds)" -ForegroundColor Gray
Write-Host ""

$maxWait = 90
$waited = 0
$dockerReady = $false

while ($waited -lt $maxWait -and -not $dockerReady) {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "✅ Docker is running!" -ForegroundColor Green
            Write-Host ""
        }
    } catch {
        # Continue waiting
    }
    if ($waited % 9 -eq 0) {
        Write-Host "   Still waiting... ($waited seconds)" -ForegroundColor Gray
    }
}

if (-not $dockerReady) {
    Write-Host ""
    Write-Host "❌ Docker has not started after $maxWait seconds" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop manually and run:" -ForegroundColor Yellow
    Write-Host "   .\start-all.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🐳 Starting Redis..." -ForegroundColor Cyan
docker-compose up -d redis

Write-Host "⏳ Waiting for Redis to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$redisReady = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $result = docker exec redis redis-cli ping 2>&1
        if ($result -match "PONG") {
            $redisReady = $true
            Write-Host "✅ Redis is working!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue
    }
    Start-Sleep -Seconds 1
}

if (-not $redisReady) {
    Write-Host "⚠️  Redis is not responding yet, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🚀 Starting the application..." -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

npm run dev

