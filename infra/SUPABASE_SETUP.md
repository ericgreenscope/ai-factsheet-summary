# Supabase Setup Guide

This guide covers three ways to set up Supabase for the ESG Factsheet AI project.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Create a Project**: Create a new project in the Supabase Dashboard
3. **Note Your Project Reference**: Found in Project Settings (looks like `abcdefghijklmnop`)

## Method 1: Automated Setup with Supabase CLI (Recommended for Beginners)

### Step 1: Install Supabase CLI

**On macOS:**
```bash
brew install supabase/tap/supabase
```

**On Windows (PowerShell as Admin):**
```powershell
scoop install supabase
# or
npm install -g supabase
```

**On Linux:**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser for authentication.

### Step 3: Run the Setup Script

**On macOS/Linux:**
```bash
cd infra
chmod +x setup-supabase.sh
./setup-supabase.sh
```

**On Windows (PowerShell):**
```powershell
cd infra
.\setup-supabase.ps1
```

The script will:
- ✅ Check Supabase CLI installation
- ✅ Verify authentication
- ✅ List your projects
- ✅ Run the database migration
- ✅ Create the storage bucket
- ✅ Set up storage policies
- ✅ Display your next steps

### Step 4: Get Your API Keys

1. Go to your Supabase Dashboard
2. Navigate to: **Settings → API**
3. Copy:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **Service Role Key** (the `service_role` secret key - keep this secure!)

### Step 5: Configure Environment Variables

See the output from the setup script for the exact values to use.

---

## Method 2: Manual Setup via Supabase Dashboard

### Step 1: Run SQL Migration

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy the contents of `supabase-migration.sql`
5. Paste into the editor
6. Click **Run**

### Step 2: Create Storage Bucket

1. Go to **Storage** in the sidebar
2. Click **New Bucket**
3. Name: `factsheets`
4. Public: `No` (private bucket)
5. Click **Create bucket**

### Step 3: Set Storage Policies (Optional)

In SQL Editor, run:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'factsheets');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'factsheets');

-- Allow service role full access (for backend)
CREATE POLICY "Service role has full access" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'factsheets');
```

### Step 4: Get Your API Keys

Same as Method 1, Step 4 above.

---

## Method 3: Using Supabase CLI with DB Push

If you're comfortable with Supabase CLI:

```bash
# Link to your project
supabase link --project-ref <your-project-ref>

# Push the migration
supabase db push

# Create storage bucket
supabase storage create factsheets --public false
```

---

## Verify Setup

After setup, you should have:

### Database Tables
- ✅ `files` - Stores uploaded PPTX metadata
- ✅ `jobs` - Tracks analysis and regeneration jobs
- ✅ `suggestions` - Stores AI-generated summaries
- ✅ `reviews` - Stores human-edited reviews

### Storage
- ✅ `factsheets` bucket created
- ✅ Policies configured (if using Method 2)

### Verify in Dashboard:

1. **Database**: Go to **Table Editor** and you should see the 4 tables
2. **Storage**: Go to **Storage** and you should see the `factsheets` bucket

---

## Troubleshooting

### "Supabase CLI not found"
- Install using one of the methods above
- Restart your terminal after installation

### "Not authenticated"
- Run `supabase login`
- Follow the browser authentication flow

### "Project not found"
- Double-check your project reference
- Make sure you're logged in with the correct account

### "Permission denied" on script execution
- On macOS/Linux: `chmod +x setup-supabase.sh`
- On Windows: Run PowerShell as Administrator

### Migration fails
- Check if tables already exist (drop them if needed)
- Ensure you have proper permissions on the project

---

## Next Steps

After Supabase is set up:

1. ✅ Get your API keys (URL + Service Role Key)
2. ✅ Configure `apps/api/.env` with Supabase credentials
3. ✅ Follow the main `QUICKSTART.md` to run the application

---

## Environment Variables Summary

You'll need these from Supabase:

```bash
# For apps/api/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

🔒 **Security Note**: 
- The **service_role** key has full admin access to your database
- NEVER commit this to version control
- NEVER expose it in client-side code
- Only use it in your backend API

---

## Need Help?

- 📚 [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- 💬 [Supabase Discord](https://discord.supabase.com/)
- 📧 Contact your team lead

## For Running on Your Project Right Now

If you want me to run this for you immediately, please provide:

1. **Your Supabase Project Reference** (from Settings → General)
2. **Access Token** (from your Supabase account)

I can then execute the migration and bucket creation for you directly.

