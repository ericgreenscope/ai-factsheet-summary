# 🚀 Start Development Environment

Your Supabase is set up! ✅ Now let's get the app running.

## Step 1: Configure Backend Environment

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings → API**
4. Copy your credentials and update `apps/api/.env`:

```bash
cd apps/api
# Copy the template
copy .env.template .env

# Edit .env and add your credentials:
# - SUPABASE_URL (from Supabase Dashboard → Settings → API → Project URL)
# - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API → service_role key)
# - OPENAI_API_KEY (your OpenAI API key)
```

## Step 2: Install Backend Dependencies

```bash
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Step 3: Start Backend

```bash
# Make sure you're in apps/api with venv activated
uvicorn main:app --reload --port 8000
```

✅ Backend should be running at http://localhost:8000
✅ API docs at http://localhost:8000/docs

## Step 4: Install Frontend Dependencies (New Terminal)

```bash
cd apps/web
npm install
```

## Step 5: Start Frontend

```bash
# In apps/web
npm run dev
```

✅ Frontend should be running at http://localhost:5173

## Step 6: Test the App

1. Open http://localhost:5173 in your browser
2. Generate a test PPTX:
   ```bash
   cd apps/api
   python test_pptx_fixture.py
   ```
3. Upload the `test_factsheet.pptx` via the web UI
4. Click "Analyze" and wait for AI summary
5. Review and approve to regenerate the PPTX!

## Quick Commands Reference

**Backend:**
```bash
cd apps/api
venv\Scripts\activate
uvicorn main:app --reload
```

**Frontend:**
```bash
cd apps/web
npm run dev
```

**Generate Test PPTX:**
```bash
cd apps/api
python test_pptx_fixture.py
```

## Troubleshooting

**"Module not found" error:**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

**"Connection refused" on frontend:**
- Make sure backend is running on port 8000
- Check `apps/web/.env` has `VITE_API_BASE_URL=http://localhost:8000`

**"Supabase error":**
- Double-check your credentials in `apps/api/.env`
- Make sure service_role key is correct (not anon key)

## What's Already Done ✅

- ✅ Supabase database tables created
- ✅ Storage bucket created
- ✅ Frontend .env configured
- ✅ Project structure ready

## What You Need to Do 📝

1. [ ] Add your Supabase credentials to `apps/api/.env`
2. [ ] Add your OpenAI API key to `apps/api/.env`
3. [ ] Install Python dependencies
4. [ ] Install npm dependencies
5. [ ] Start both servers
6. [ ] Upload and test!

🎉 You're almost there!

