# 🚀 Complete Local Setup Guide

Let's get everything running locally first! This will be much faster for testing and debugging.

---

## Step 1: Backend Setup (Terminal 1)

```bash
cd apps/api

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "SUPABASE_URL=https://gzyecykmsjexhvunyskw.supabase.co" > .env
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWVjeWttc2pleGh2dW55c2t3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNDc5OSwiZXhwIjoyMDc1ODgwNzk5fQ.dJnlTzml-BMvNuNTkSN9Rs-EIcjmd0jJnCjMGa2gfHk" >> .env
echo "OPENAI_API_KEY=AizaSyBneNuvOrOJFjasUKMwEWhqCbso2AXFiG8" >> .env
echo "OPENAI_MODEL=gemini-pro" >> .env
echo "CORS_ORIGIN=http://localhost:5173" >> .env

# Start the backend
uvicorn main:app --reload --port 8000
```

✅ **Backend should be running at:** http://localhost:8000

---

## Step 2: Frontend Setup (Terminal 2)

```bash
cd apps/web

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start the frontend
npm run dev
```

✅ **Frontend should be running at:** http://localhost:5173

---

## Step 3: Generate Test PPTX

```bash
cd apps/api

# Generate test PPTX with AI_SUMMARY placeholder
python test_pptx_fixture.py
```

✅ **Creates:** `test_factsheet.pptx` in the `apps/api` directory

---

## Step 4: Test the Full Workflow

1. **Open browser:** http://localhost:5173
2. **Upload:** Drag and drop `apps/api/test_factsheet.pptx`
3. **Analyze:** Click "Analyze" button
4. **Wait:** AI generates summary (30-60 seconds)
5. **Review:** Edit the summary if needed
6. **Approve:** Click "Approve & Regenerate PPT"
7. **Download:** Get the regenerated PPTX with AI summary!

---

## Step 5: Verify Everything Works

**Test API endpoints:**
```bash
# Health check
curl http://localhost:8000/healthz

# API docs (in browser)
open http://localhost:8000/docs
```

**Test Gemini integration:**
```bash
cd apps/api
python -c "
from ai_service import generate_esg_summary
result = generate_esg_summary('Test content about ESG and sustainability')
print('✅ Gemini working!')
print(f'Strengths: {len(result[\"strengths\"])} bullets')
"
```

---

## Troubleshooting

**Backend Issues:**
- **Port 8000 busy?** Change port: `uvicorn main:app --reload --port 8001`
- **Dependencies fail?** Try: `pip install --upgrade pip` first

**Frontend Issues:**
- **Port 5173 busy?** Vite will suggest alternative port
- **API connection fails?** Check backend is running

**PPTX Issues:**
- **No AI_SUMMARY shape?** Use `python test_pptx_fixture.py` to generate valid test file

---

## Success Indicators

✅ **Backend:** http://localhost:8000/healthz returns `{"ok": true}`
✅ **Frontend:** http://localhost:5173 loads without errors
✅ **File Upload:** Can upload PPTX files
✅ **AI Analysis:** Generates summary with 3 sections
✅ **PPTX Regeneration:** Creates new PPTX with AI_SUMMARY filled

---

## Ready to Deploy?

Once local testing works perfectly, Render deployment should work too!

**Need help with any step?** Just let me know what error you're getting! 🚀
