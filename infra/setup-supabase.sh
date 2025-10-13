#!/bin/bash
# ESG Factsheet AI - Supabase Setup Script
# This script uses Supabase CLI to set up the database and storage

set -e  # Exit on error

echo "🚀 ESG Factsheet AI - Supabase Setup"
echo "====================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo "  or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if user is logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo ""
    echo "Please log in to Supabase:"
    echo "Run: supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Get project reference
echo "📋 Available Projects:"
supabase projects list
echo ""

read -p "Enter your Supabase Project Reference (e.g., abcdefghijklmnop): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference is required"
    exit 1
fi

echo ""
echo "🗄️  Setting up database..."
echo ""

# Link to project (creates .supabase folder)
supabase link --project-ref "$PROJECT_REF"

# Run migration
echo "📊 Running database migration..."
supabase db push --db-url "postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Alternative: Use SQL directly
echo "📝 Applying database schema..."
supabase db execute --file supabase-migration.sql

echo "✅ Database schema created"
echo ""

# Create storage bucket
echo "🪣 Creating storage bucket..."
supabase storage create factsheets --public=false

echo "✅ Storage bucket 'factsheets' created"
echo ""

# Set storage policies (optional - adjust as needed)
echo "🔒 Setting up storage policies..."
cat > /tmp/storage_policies.sql << 'EOF'
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'factsheets');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'factsheets');

-- Allow service role full access
CREATE POLICY "Service role has full access" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'factsheets');
EOF

supabase db execute --file /tmp/storage_policies.sql
rm /tmp/storage_policies.sql

echo "✅ Storage policies configured"
echo ""

# Get project details
echo "📋 Getting project details..."
PROJECT_URL=$(supabase projects list | grep "$PROJECT_REF" | awk '{print $3}')

echo ""
echo "✅ Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Get your credentials from Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""
echo "2. Create apps/api/.env with:"
echo "   SUPABASE_URL=https://$PROJECT_REF.supabase.co"
echo "   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
echo "   OPENAI_API_KEY=<your-openai-key>"
echo "   OPENAI_MODEL=gpt-4o-mini"
echo "   CORS_ORIGIN=http://localhost:5173"
echo ""
echo "3. Create apps/web/.env with:"
echo "   VITE_API_BASE_URL=http://localhost:8000"
echo ""
echo "4. Start the backend:"
echo "   cd apps/api"
echo "   pip install -r requirements.txt"
echo "   uvicorn main:app --reload"
echo ""
echo "5. Start the frontend:"
echo "   cd apps/web"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "🎉 Happy coding!"

