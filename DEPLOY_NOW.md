# 🚀 Deploy Your ESG Factsheet AI - RIGHT NOW

Your Supabase is already set up! ✅ Let's get this running ASAP.

## Option 1: Run Locally First (Recommended - 5 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **service_role key** (the secret key under "Service role")

### Step 2: Configure Backend

Create `apps/api/.env`:
```env
SUPABASE_URL=YOUR_PROJECT_URL_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Start Backend (Terminal 1)

```bash
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

✅ Backend: http://localhost:8000
✅ API Docs: http://localhost:8000/docs

### Step 4: Start Frontend (Terminal 2)

```bash
cd apps/web
npm install
npm run dev
```

✅ App: http://localhost:5173

### Step 5: Test It!

```bash
# Generate test PPTX
cd apps/api
python test_pptx_fixture.py
```

Then upload `test_factsheet.pptx` at http://localhost:5173!

---

## Option 2: Deploy to Render (After local works)

You have a Render API key, so let's deploy!

### Prerequisites:
1. Push your code to GitHub
2. Get your Supabase credentials (same as above)
3. Get your OpenAI API key

### Using Render Dashboard:

1. Go to https://dashboard.render.com
2. Click **New → Blueprint**
3. Connect your GitHub repo
4. Point to `infra/render.yaml`
5. Set environment variables:

**For API service:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
CORS_ORIGIN=https://your-web-service.onrender.com
```

**For Web service:**
```
VITE_API_BASE_URL=https://your-api-service.onrender.com
```

6. Click **Apply**

### Using Render API (Advanced):

If you want me to deploy using your API key (`rnd_91eLc2zi1WHGkFKU0w3lUlAbQvmx`), I'll need:
1. Your GitHub repo URL
2. Your Supabase credentials
3. Your OpenAI API key

---

## What's Already Done ✅

- ✅ Full-stack application code
- ✅ Supabase database tables
- ✅ Supabase storage bucket
- ✅ Database migrations
- ✅ Frontend .env configured
- ✅ Deployment config (render.yaml)

## What You Need 📝

1. [ ] Supabase credentials → apps/api/.env
2. [ ] OpenAI API key → apps/api/.env
3. [ ] Install dependencies
4. [ ] Start servers

---

## 🎯 QUICK START (Copy & Paste):

```powershell
# 1. Configure backend (edit this file with your keys)
notepad apps/api/.env

# 2. Start backend
cd apps/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. In NEW terminal - Start frontend
cd apps/web
npm install
npm run dev

# 4. Generate test file
cd apps/api
python test_pptx_fixture.py

# 5. Open browser
start http://localhost:5173
```

Done! 🎉

