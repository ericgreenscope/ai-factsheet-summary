# 🚀 Deploy to Render - Quick Guide

Your code is on GitHub! ✅ Now let's deploy it to production.

**Repo URL**: https://github.com/ericgreenscope/ai-factsheet-summary

---

## Option 1: Deploy via Render Dashboard (5 minutes)

### Step 1: Connect GitHub to Render

1. Go to: https://dashboard.render.com
2. If not logged in, sign in with GitHub (or your existing account)
3. Go to **Account Settings → GitHub** and connect your GitHub account
4. Grant access to the `ai-factsheet-summary` repository

### Step 2: Create Blueprint

1. In Render Dashboard, click **New +** (top right)
2. Select **Blueprint**
3. Click **Connect a repository**
4. Select `ericgreenscope/ai-factsheet-summary`
5. Render will detect `infra/render.yaml` automatically

### Step 3: Configure Environment Variables

Render will create 2 services (API + Web). Set these variables:

#### **For `esg-factsheet-api` service:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=https://YOUR-WEB-SERVICE.onrender.com
```

(Note: You'll need to update `CORS_ORIGIN` after the web service is created)

#### **For `esg-factsheet-web` service:**
```
VITE_API_BASE_URL=https://YOUR-API-SERVICE.onrender.com
```

(Note: You'll need to update this after the API service is created)

### Step 4: Deploy!

1. Click **Apply** or **Create Blueprint**
2. Render will:
   - Build the API service (Python/FastAPI)
   - Build the web service (React/Vite)
   - Deploy both services
   - Give you URLs for each

### Step 5: Update CORS

After deployment:
1. Get your web service URL (e.g., `https://esg-factsheet-web.onrender.com`)
2. Update API service's `CORS_ORIGIN` environment variable
3. Get your API service URL (e.g., `https://esg-factsheet-api.onrender.com`)
4. Update web service's `VITE_API_BASE_URL` environment variable
5. Both services will auto-redeploy

---

## Option 2: Deploy via Render API (I can do it!)

Since you have a Render API key: `rnd_91eLc2zi1WHGkFKU0w3lUlAbQvmx`

I can deploy it for you! Just provide:
1. Your Supabase URL (from https://supabase.com/dashboard → Settings → API)
2. Your Supabase Service Role Key
3. Your OpenAI API Key

And I'll:
- ✅ Create both services on Render
- ✅ Set all environment variables
- ✅ Deploy everything
- ✅ Give you the live URLs

---

## What Gets Deployed

**API Service** (Python/FastAPI):
- URL: `https://esg-factsheet-api-XXXXX.onrender.com`
- Health check: `/healthz`
- API docs: `/docs`

**Web Service** (React/Vite):
- URL: `https://esg-factsheet-web-XXXXX.onrender.com`
- Upload interface
- Review dashboard
- Excel export

---

## Deployment Time

- First deploy: ~5-10 minutes (installing dependencies)
- Future deploys: ~2-3 minutes
- Both services deploy in parallel

---

## Free Tier Notes

Render free tier:
- ✅ Perfect for testing
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ First request after sleep takes ~30 sec to wake up
- 💡 Upgrade to paid tier ($7/month per service) for always-on

---

## After Deployment

1. ✅ Test the API: Visit `https://your-api.onrender.com/healthz`
2. ✅ Open the web app: Visit your web URL
3. ✅ Upload a test PPTX
4. ✅ Generate AI summary
5. ✅ Download regenerated PPTX

---

## Troubleshooting

**Build fails:**
- Check environment variables are set
- Review build logs in Render dashboard

**CORS errors:**
- Update `CORS_ORIGIN` in API service to match your web URL
- Update `VITE_API_BASE_URL` in web service to match your API URL

**API not working:**
- Check Supabase credentials are correct
- Verify OpenAI API key has credits
- Check `/healthz` endpoint responds

---

## Ready to Deploy?

Choose your option:
1. **I'll do it manually via dashboard** (you have full control)
2. **You do it for me via API** (provide Supabase + OpenAI keys)

Let me know! 🚀

