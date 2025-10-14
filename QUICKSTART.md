# ESG Factsheet AI - Quick Start Guide

This guide will help you get the application running locally in minutes.

## Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **Supabase account** (free tier works)
- **Google Gemini Pro API key** (free tier available)

## Step 1: Clone and Setup

```bash
cd esg-factsheet-ai
```

## Step 2: Supabase Setup

**Choose Your Method:**

### Option A: Automated Setup with CLI (Recommended for Beginners) ⭐

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   # or on macOS: brew install supabase/tap/supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Run the automated setup script:
   ```bash
   cd infra
   # On Windows: .\setup-supabase.ps1
   # On Mac/Linux: ./setup-supabase.sh
   ```

   The script will create everything automatically!

4. Get your credentials from Supabase Dashboard:
   - Go to Settings > API
   - Copy your `Project URL` and `service_role` key

📚 **Detailed instructions**: See `infra/SUPABASE_SETUP.md`

### Option B: Manual Setup via Dashboard

1. Create a new project at [supabase.com](https://supabase.com)

2. Run the database migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste contents of `infra/supabase-migration.sql`
   - Click "Run"

3. Create storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `factsheets`
   - Set to private

4. Get your credentials:
   - Go to Settings > API
   - Copy your `Project URL` and `service_role` key

## Step 3: Backend Setup

```bash
cd apps/api

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your credentials
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
OPENAI_API_KEY=AIzaSy-your-gemini-api-key-here
OPENAI_MODEL=gemini-pro
CORS_ORIGIN=http://localhost:5173
EOF

# Start the API
uvicorn main:app --reload --port 8000
```

Backend running at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

## Step 4: Frontend Setup

Open a new terminal:

```bash
cd apps/web

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

Frontend running at `http://localhost:5173`

## Step 5: Create Test PPTX

Generate a test PPTX file with AI_SUMMARY placeholder:

```bash
cd apps/api
python test_pptx_fixture.py
```

This creates `test_factsheet.pptx` ready for upload.

## Step 6: Use the Application

1. **Open** `http://localhost:5173` in your browser

2. **Upload** the test PPTX file:
   - Go to Upload page
   - Drag and drop `test_factsheet.pptx`
   - Optional: Enter a company name
   - Click "Upload & Continue"

3. **Analyze** the file:
   - You'll be redirected to the Files page
   - Click "Analyze" button for your file
   - Wait ~30-60 seconds for AI analysis

4. **Review** the summary:
   - Click "Review" to open the review page
   - Edit the AI-generated summary if needed
   - Click "Save Draft" to save changes

5. **Approve** and regenerate:
   - Click "Approve & Regenerate PPT"
   - Wait for regeneration to complete
   - Download the regenerated PPTX

6. **Verify** the result:
   - Open the downloaded PPTX
   - Check Slide 5 - the AI_SUMMARY placeholder is now filled with your approved summary!

## Testing the API

Run the test suite:

```bash
cd apps/api
pytest test_main.py -v
```

All tests should pass ✓

## Troubleshooting

### Backend Issues

**"Module not found" errors:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**"Supabase connection error":**
- Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`
- Verify bucket "factsheets" exists in Supabase Storage

**"OpenAI API error":**
- Verify your GEMINI_API_KEY is correct
- Check you have available credits

### Frontend Issues

**"Failed to fetch" errors:**
- Make sure backend is running on port 8000
- Check VITE_API_BASE_URL in `apps/web/.env`

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### PPTX Issues

**"AI_SUMMARY shape not found":**
- The PPTX must have a text shape named "AI_SUMMARY"
- Use `test_pptx_fixture.py` to generate a valid test file
- Or manually add a text box and name it "AI_SUMMARY" in PowerPoint

## Next Steps

- Deploy to Render (see `infra/render.yaml`)
- Add more PPTX files for batch processing
- Customize the AI prompts in `apps/api/ai_service.py`
- Export summaries to Excel via "Export to Excel" button

## Architecture Overview

```
User → React Frontend → FastAPI Backend → Supabase (DB + Storage)
                              ↓
                         OpenAI API
                              ↓
                      AI-Generated Summary
                              ↓
                   Regenerated PPTX with Summary
```

## Support

- Backend API docs: `http://localhost:8000/docs`
- Backend README: `apps/api/README.md`
- Frontend README: `apps/web/README.md`
- Main README: `README.md`

## Success! 🎉

You now have a fully functional ESG Factsheet AI application running locally. Upload your own ESG factsheets (with AI_SUMMARY placeholders) and start generating summaries!

