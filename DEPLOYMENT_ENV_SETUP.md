# 🔧 Manual Environment Variable Setup

After deploying with `render.yaml`, you need to manually set the cross-service environment variables in the Render dashboard.

## Step 1: Get Your Service URLs

1. Go to https://dashboard.render.com
2. Find your deployed services:
   - `esg-factsheet-api` (Backend API)
   - `esg-factsheet-web` (Frontend)

3. Copy the URLs:
   - API URL: `https://esg-factsheet-api.onrender.com` (or similar)
   - Web URL: `https://esg-factsheet-web.onrender.com` (or similar)

## Step 2: Set Environment Variables

### For the Web Service (`esg-factsheet-web`):

1. Click on your web service
2. Go to **Environment** tab
3. Add/Update:
   ```
   VITE_API_BASE_URL = https://esg-factsheet-api.onrender.com
   ```
   (Replace with your actual API service URL)

### For the API Service (`esg-factsheet-api`):

1. Click on your API service
2. Go to **Environment** tab
3. Add/Update:
   ```
   CORS_ORIGIN = https://esg-factsheet-web.onrender.com
   ```
   (Replace with your actual web service URL)

## Step 3: Redeploy

After saving the environment variables:
- Both services will automatically redeploy
- Wait 2-3 minutes for the rebuild to complete
- Test by uploading a PPT file

## Troubleshooting

### If you get 404 errors:
- Verify the URLs are correct (copy from Render dashboard)
- Make sure both services are deployed and running
- Check that environment variables are saved

### If you get CORS errors:
- Ensure `CORS_ORIGIN` matches your web service URL exactly
- Include `https://` protocol
- No trailing slash

### If API calls fail:
- Ensure `VITE_API_BASE_URL` matches your API service URL exactly
- Include `https://` protocol
- No trailing slash

## Example URLs

**API Service:**
```
https://esg-factsheet-api.onrender.com
```

**Web Service:**
```
https://esg-factsheet-web.onrender.com
```

**Environment Variables:**

**Web Service:**
```
VITE_API_BASE_URL=https://esg-factsheet-api.onrender.com
```

**API Service:**
```
CORS_ORIGIN=https://esg-factsheet-web.onrender.com
```

## Why Manual Setup?

Render's `fromService` auto-population was returning service names instead of full URLs, causing `net::ERR_NAME_NOT_RESOLVED` errors. Manual configuration ensures reliable URLs.
