# Debug Steps for "Failed to complete analysis" Error

## Error: Failed to complete analysis

This error means the frontend successfully loaded, but the `/analyze` API endpoint is failing.

## Step-by-Step Debugging

### 1. Check if the App Deployed Successfully

Visit your Vercel dashboard:
- Go to: https://vercel.com/dashboard
- Check if the latest deployment shows "Ready" (green)
- If it shows "Error" or "Failed", click on it to see build logs

### 2. Test the Health Endpoint

Open your browser and visit:
```
https://your-app.vercel.app/health
```

**What you should see:**
```json
{
  "status": "ok",
  "python_version": "3.11.x",
  "groq_key_set": true,
  "tavily_key_set": true
}
```

**If you see errors:**

❌ **404 Not Found** → Flask app not loading at all
- Solution: Check Vercel logs for import errors

❌ **`groq_key_set: false`** → Environment variable not set
- Solution: Add `GROQ_API_KEY` in Vercel dashboard

❌ **`tavily_key_set: false`** → Environment variable not set
- Solution: Add `TAVILY_API_KEY` in Vercel dashboard

### 3. Check Browser Console

1. Open your app: `https://your-app.vercel.app/`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Enter a company name and submit
5. Look for errors in red

**Common errors:**

```
Failed to fetch
```
→ CORS issue or endpoint not responding

```
500 Internal Server Error
```
→ Python code crashing (check Vercel function logs)

```
Error: Failed to complete analysis
```
→ Frontend caught an error from backend

### 4. Check Network Tab

In Developer Tools:
1. Go to **Network** tab
2. Enter a company name and submit
3. Look for the `/analyze` request
4. Click on it to see:
   - **Status Code**: Should be 200, if 500 = backend error
   - **Response**: Shows the actual error message
   - **Headers**: Check if request was sent correctly

### 5. Check Vercel Function Logs

**Option A: Via Dashboard**
1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Click **Deployments** → Click latest deployment
4. Click **Functions** tab
5. Click on `api/index.py`
6. Look for error messages in logs

**Option B: Via CLI**
```bash
vercel logs --follow
```

Then trigger the error by submitting a company name.

### 6. Common Issues and Solutions

#### Issue: "ModuleNotFoundError: No module named 'flask'"

**Cause**: `.vercelignore` was blocking `requirements.txt`

**Solution**: Already fixed! Make sure to commit and redeploy:
```bash
git add .vercelignore requirements.txt
git commit -m "Fix .vercelignore to include requirements.txt"
git push
```

#### Issue: "GROQ_API_KEY not found"

**Cause**: Environment variables not set in Vercel

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add:
   - `GROQ_API_KEY` = your key
   - `TAVILY_API_KEY` = your key
3. Redeploy the project

#### Issue: "Template not found"

**Cause**: Template paths incorrect

**Solution**: Already fixed with absolute paths in `app_vercel.py`

#### Issue: Request timeout / 504 error

**Cause**: Analysis takes longer than timeout limit

**Current timeout**: 60 seconds (set in vercel.json)

**Solution**:
- If on Hobby plan, upgrade to Pro
- OR reduce `max_tokens` in `call_llm()` function
- OR reduce `max_results` in Tavily searches

### 7. Test Locally First

Before debugging on Vercel, test locally:

```bash
# Run the Vercel version locally
python app_vercel.py
```

Then test in browser at `http://localhost:5000`

If it works locally but not on Vercel → deployment issue
If it fails locally too → code issue

### 8. Manual API Test

Test the `/analyze` endpoint directly:

```bash
curl -X POST https://your-app.vercel.app/analyze \
  -H "Content-Type: application/json" \
  -d '{"company": "Tesla", "config": {}}'
```

**Expected**: Should return JSON with analysis results after 30-60 seconds

**If error**: You'll see the actual error message from the backend

### 9. Checklist

Before the app can work, verify:

- [ ] `requirements.txt` is committed and NOT in `.vercelignore`
- [ ] `.vercelignore` does NOT have `*.txt` (use specific file names)
- [ ] Environment variables set in Vercel dashboard
- [ ] Latest code is pushed to GitHub
- [ ] Vercel shows "Ready" status for latest deployment
- [ ] `/health` endpoint returns `status: ok`
- [ ] Both API keys show `true` in health check

## Most Likely Issue

Based on the error pattern, the most likely cause is:

**❌ `.vercelignore` was ignoring `requirements.txt`**

This has been fixed. Now you need to:

1. **Commit the fixes**:
```bash
git add .vercelignore requirements.txt
git commit -m "Fix .vercelignore - allow requirements.txt"
git push
```

2. **Verify deployment**:
- Wait for Vercel to redeploy (automatic)
- Check deployment status in dashboard
- Test `/health` endpoint

3. **Test analysis**:
- Visit your app
- Enter "Tesla"
- Should work now!

## If Still Not Working

Share these with me:

1. **URL of your deployed app**
2. **Output of `/health` endpoint**
3. **Error message from browser console** (F12 → Console tab)
4. **Vercel function logs** (from dashboard or `vercel logs`)

Then I can pinpoint the exact issue.
