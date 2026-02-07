# Script to stop Redis
# Run with: .\stop-redis.ps1

Write-Host "🛑 Stopping Redis..." -ForegroundColor Cyan

docker stop redis

Write-Host "✅ Redis stopped" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To remove the container: docker rm redis" -ForegroundColor Yellow

