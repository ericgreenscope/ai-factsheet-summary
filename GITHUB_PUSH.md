# 🚀 Push to GitHub - Instructions

Your code is ready to push! ✅ Choose one of these methods:

---

## Method 1: Create Repo via GitHub Web (Easiest)

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Fill in:
   - **Repository name**: `ai-factsheet-summary` (or `esg-factsheet-ai`)
   - **Description**: "AI-powered ESG factsheet analysis with automatic PPTX regeneration"
   - **Visibility**: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have them)
3. Click **Create repository**

### Step 2: Push Your Code

GitHub will show you commands. Use these instead (already committed):

```powershell
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ai-factsheet-summary.git

# Or if using Greenscope organization:
git remote add origin https://github.com/Greenscope/ai-factsheet-summary.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Method 2: Create Under Greenscope Organization

If you want it under your Greenscope organization:

1. Go to: https://github.com/organizations/Greenscope/repositories/new
2. Same steps as above
3. Use this remote URL:
   ```bash
   git remote add origin https://github.com/Greenscope/ai-factsheet-summary.git
   ```

---

## Method 3: I Can Do It (Need Access Token)

If you have a GitHub Personal Access Token, I can create the repo and push for you.

You'll need a token with `repo` scope:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select `repo` scope
4. Copy the token

Then paste it here and I'll handle everything!

---

## Quick Commands (After Creating Repo)

```powershell
# Set remote (update URL with your actual repo)
git remote add origin https://github.com/YOUR_USERNAME_OR_ORG/ai-factsheet-summary.git

# Push
git branch -M main
git push -u origin main
```

---

## ✅ What Happens After Push

Once pushed to GitHub, you can:

1. **Deploy to Render**:
   - Go to https://dashboard.render.com
   - New → Blueprint
   - Connect your GitHub repo
   - Point to `infra/render.yaml`
   - Add environment variables
   - Deploy! 🚀

2. **Collaborate**:
   - Share with team members
   - Set up GitHub Actions (CI/CD)
   - Enable branch protection

3. **Keep Private Secrets Safe**:
   - ✅ `.gitignore` already excludes `.env` files
   - ✅ No API keys in the repo
   - ✅ Safe to push!

---

## 🔒 Security Check

Before pushing, verify `.env` files are NOT staged:
```bash
git status
```

You should NOT see:
- `apps/api/.env`
- `apps/web/.env`

These are in `.gitignore` so they won't be pushed. ✅

---

## Need Help?

Let me know:
- Your GitHub username
- Whether you want it under personal or Greenscope organization
- If you want me to do it (provide access token)

Ready to push! 🎉

