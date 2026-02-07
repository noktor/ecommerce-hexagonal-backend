# Script that waits for Docker and then starts everything
Write-Host "Waiting for Docker to be ready..." -ForegroundColor Yellow

$maxWait = 60
$waited = 0
$dockerReady = $false

while ($waited -lt $maxWait -and -not $dockerReady) {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "OK Docker is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue
    }
    if ($waited % 6 -eq 0) {
        Write-Host "Still waiting... ($waited seconds)" -ForegroundColor Gray
    }
}

if (-not $dockerReady) {
    Write-Host "ERROR: Docker is not available after $maxWait seconds" -ForegroundColor Red
    Write-Host "Close and reopen Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting Redis and application..." -ForegroundColor Cyan
Write-Host ""

# Try with docker-compose first
try {
    docker-compose up --build -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK Everything started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "View logs:" -ForegroundColor Yellow
        Write-Host "docker-compose logs -f app" -ForegroundColor Gray
        exit 0
    }
} catch {
    # Continue
}

# If it fails, try with docker compose (new version)
Write-Host "Trying with docker compose..." -ForegroundColor Yellow
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK Everything started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "View logs:" -ForegroundColor Yellow
    Write-Host "docker compose logs -f app" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR starting services" -ForegroundColor Red
    exit 1
}

