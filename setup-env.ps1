# Quick Setup Script for SoloBoard
# Run this in PowerShell: .\setup-env.ps1

Write-Host "🚀 SoloBoard Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit
    }
}

# Generate random AUTH_SECRET
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$authSecret = [Convert]::ToBase64String($bytes)

Write-Host "✅ Generated AUTH_SECRET" -ForegroundColor Green

# Ask for database type
Write-Host ""
Write-Host "Select database type:" -ForegroundColor Cyan
Write-Host "1. SQLite (Recommended for development)"
Write-Host "2. PostgreSQL (For production)"
$dbChoice = Read-Host "Enter choice (1 or 2)"

if ($dbChoice -eq "2") {
    Write-Host ""
    Write-Host "Enter PostgreSQL connection details:" -ForegroundColor Cyan
    $dbUrl = Read-Host "DATABASE_URL (e.g., postgresql://user:pass@localhost:5432/dbname)"
    $dbProvider = "postgresql"
} else {
    $dbUrl = "file:./local.db"
    $dbProvider = "sqlite"
    Write-Host "✅ Using SQLite database" -ForegroundColor Green
}

# Create .env.local file
$envContent = @"
# Database Configuration
DATABASE_URL=$dbUrl
DATABASE_PROVIDER=$dbProvider
DB_SINGLETON_ENABLED=true

# Authentication
AUTH_SECRET=$authSecret
AUTH_URL=http://localhost:3000

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SoloBoard

# Optional: Uncomment and configure if needed
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# SHIPANY_API_KEY=your-shipany-api-key
# SHIPANY_MERCHANDISE_ID=your-merchandise-id
# RESEND_API_KEY=re_your_api_key
# CREEM_API_KEY=your-creem-api-key
"@

Set-Content -Path ".env.local" -Value $envContent

Write-Host ""
Write-Host "✅ .env.local file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: pnpm db:push" -ForegroundColor Yellow
Write-Host "2. Run: pnpm run init:soloboard" -ForegroundColor Yellow
Write-Host "3. Run: pnpm dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Setup complete! You can now start developing." -ForegroundColor Green




