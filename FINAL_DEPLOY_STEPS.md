# 🚀 Final Deploy Steps - Super Easy

Your code is on GitHub! ✅ 
Your Supabase is configured! ✅

## Quick Deploy (5 minutes):

### Step 1: Go to Render Dashboard

Visit: https://dashboard.render.com/blueprints

### Step 2: Create New Blueprint

1. Click **New Blueprint Instance**
2. Connect to: `ericgreenscope/ai-factsheet-summary`
3. Render will detect `infra/render.yaml` automatically ✅

### Step 3: Set Environment Variables

Render will ask for these variables:

#### **For API Service:**
```
SUPABASE_URL = https://gzyecykmsjexhvunyskw.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWVjeWttc2pleGh2dW55c2t3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNDc5OSwiZXhwIjoyMDc1ODgwNzk5fQ.dJnlTzml-BMvNuNTkSN9Rs-EIcjmd0jJnCjMGa2gfHk
OPENAI_API_KEY = (leave blank for now - add later when ready)
OPENAI_MODEL = gpt-4o-mini
CORS_ORIGIN = (will auto-fill after web service is created)
```

#### **For Web Service:**
```
VITE_API_BASE_URL = (will auto-fill after API service is created)
```

### Step 4: Deploy!

Click **Apply** or **Deploy** and Render will:
- Build API service (~5 min)
- Build Web service (~3 min)
- Give you live URLs

### Step 5: Update Cross-References

After both services are deployed:
1. Copy your Web service URL (e.g., `https://esg-factsheet-web.onrender.com`)
2. Update API service environment variable:
   - `CORS_ORIGIN` = your web URL
3. Copy your API service URL (e.g., `https://esg-factsheet-api.onrender.com`)
4. Update Web service environment variable:
   - `VITE_API_BASE_URL` = your API URL
5. Both will auto-redeploy (~2 min)

---

## 🎯 Your Services Will Be:

**API Service:**
- URL: `https://esg-factsheet-api-XXXXX.onrender.com`
- Health Check: `/healthz`
- API Docs: `/docs`
- Status: ⚠️ Will work for everything EXCEPT AI analysis (needs OpenAI key)

**Web Service:**
- URL: `https://esg-factsheet-web-XXXXX.onrender.com`
- Status: ✅ Fully functional (upload, download, UI)

---

## 📝 When You Add OpenAI Key:

Later, when you want AI analysis:
1. Go to Render Dashboard → API Service → Environment
2. Add: `OPENAI_API_KEY = sk-your-key-here`
3. Service will auto-redeploy
4. AI features will work! 🎉

---

## ⚡ Faster Alternative: Pre-Configured Values

I can create a pre-configured render.yaml with all your values filled in. Want me to do that?
Just say "yes" and I'll update the file so you just click Deploy with no manual entry needed!

---

## 🆘 Need Help?

If you get stuck:
1. Check build logs in Render dashboard
2. Verify environment variables are set
3. Make sure GitHub repo is connected
4. Check Supabase credentials are correct

---

Ready? Go to: https://dashboard.render.com/blueprints and start! 🚀

