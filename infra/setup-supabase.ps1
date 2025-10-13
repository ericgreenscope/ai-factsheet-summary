# ESG Factsheet AI - Supabase Setup Script (PowerShell for Windows)
# This script uses Supabase CLI to set up the database and storage

$ErrorActionPreference = "Stop"

Write-Host "🚀 ESG Factsheet AI - Supabase Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:"
    Write-Host "  npm install -g supabase"
    Write-Host "  or"
    Write-Host "  scoop install supabase"
    Write-Host ""
    exit 1
}

Write-Host ""

# Check if user is logged in
Write-Host "🔐 Checking Supabase authentication..." -ForegroundColor Yellow
try {
    $null = supabase projects list 2>&1
    Write-Host "✅ Authenticated" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Please log in to Supabase:" -ForegroundColor Red
    Write-Host "Run: supabase login"
    Write-Host ""
    exit 1
}

Write-Host ""

# Get project reference
Write-Host "📋 Available Projects:" -ForegroundColor Cyan
supabase projects list
Write-Host ""

$PROJECT_REF = Read-Host "Enter your Supabase Project Reference (e.g., abcdefghijklmnop)"

if ([string]::IsNullOrWhiteSpace($PROJECT_REF)) {
    Write-Host "❌ Project reference is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
Write-Host ""

# Link to project
Write-Host "🔗 Linking to project..." -ForegroundColor Yellow
supabase link --project-ref $PROJECT_REF

# Run migration
Write-Host "📝 Applying database schema..." -ForegroundColor Yellow
supabase db push

Write-Host "✅ Database schema created" -ForegroundColor Green
Write-Host ""

# Create storage bucket
Write-Host "🪣 Creating storage bucket..." -ForegroundColor Yellow
supabase storage create factsheets --public false

Write-Host "✅ Storage bucket 'factsheets' created" -ForegroundColor Green
Write-Host ""

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Get your credentials from Supabase Dashboard:"
Write-Host "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
Write-Host ""
Write-Host "2. Create apps/api/.env with:"
Write-Host "   SUPABASE_URL=https://$PROJECT_REF.supabase.co"
Write-Host "   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
Write-Host "   OPENAI_API_KEY=<your-openai-key>"
Write-Host "   OPENAI_MODEL=gpt-4o-mini"
Write-Host "   CORS_ORIGIN=http://localhost:5173"
Write-Host ""
Write-Host "3. Create apps/web/.env with:"
Write-Host "   VITE_API_BASE_URL=http://localhost:8000"
Write-Host ""
Write-Host "4. Start the backend:"
Write-Host "   cd apps/api"
Write-Host "   pip install -r requirements.txt"
Write-Host "   uvicorn main:app --reload"
Write-Host ""
Write-Host "5. Start the frontend:"
Write-Host "   cd apps/web"
Write-Host "   npm install"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green

