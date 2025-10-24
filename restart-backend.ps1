# Restart backend container only
Write-Host "Stopping backend container..." -ForegroundColor Yellow
docker compose stop skud-backend

Write-Host "Rebuilding backend..." -ForegroundColor Yellow  
docker compose build backend

Write-Host "Starting backend..." -ForegroundColor Yellow
docker compose up -d skud-backend

Write-Host "Backend restarted successfully!" -ForegroundColor Green