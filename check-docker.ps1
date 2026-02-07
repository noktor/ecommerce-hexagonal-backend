# Script to verify Docker status
Write-Host "Checking Docker status..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "1. Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   OK $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Docker is not installed!" -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
Write-Host ""
Write-Host "2. Checking Docker daemon..." -ForegroundColor Yellow
try {
    $null = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Docker daemon is running" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Docker daemon is NOT running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Solution:" -ForegroundColor Yellow
        Write-Host "   - Open Docker Desktop" -ForegroundColor White
        Write-Host "   - Wait for the icon to appear in the taskbar" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "   ERROR: Docker daemon is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Solution:" -ForegroundColor Yellow
    Write-Host "   - Open Docker Desktop" -ForegroundColor White
    Write-Host "   - Wait for the icon to appear in the taskbar" -ForegroundColor White
    exit 1
}

# Check docker-compose
Write-Host ""
Write-Host "3. Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK docker-compose available" -ForegroundColor Green
        Write-Host "   $composeVersion" -ForegroundColor Gray
    } else {
        # Try with new version
        $composeVersion = docker compose version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   OK docker compose available (new version)" -ForegroundColor Green
            Write-Host "   $composeVersion" -ForegroundColor Gray
        } else {
            throw "Not available"
        }
    }
} catch {
    Write-Host "   WARNING: docker-compose not found, but you can use 'docker compose'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "OK Everything is ready to run Docker!" -ForegroundColor Green
Write-Host ""
Write-Host "   Run:" -ForegroundColor Yellow
Write-Host '   .\docker-up.ps1' -ForegroundColor White
Write-Host "   or" -ForegroundColor Gray
Write-Host '   npm run docker:up' -ForegroundColor White
