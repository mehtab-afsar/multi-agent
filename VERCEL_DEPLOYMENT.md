# Vercel Deployment - Issue Analysis & Fix

## What Was Wrong (Root Cause Analysis)

### The 500 Error: FUNCTION_INVOCATION_FAILED

This error occurs when Vercel's Python serverless runtime fails to execute your function. Here's what was happening:

### **Issue 1: Incorrect Module Import Pattern**
- **Problem**: The original `api/index.py` tried to import from `app_vercel.py` in the parent directory
- **Why it failed**: Vercel's serverless runtime has strict path resolution and doesn't handle relative imports well
- **Impact**: Module import failed before the function could even execute

### **Issue 2: Environment Variable Loading**
- **Problem**: Using `load_dotenv()` and `python-dotenv` package
- **Why it failed**: `.env` files don't exist in Vercel's serverless environment
- **Impact**: API keys weren't being loaded, causing client initialization to fail

### **Issue 3: Early Client Initialization**
- **Problem**: `groq = Groq(api_key=...)` at module level
- **Why it failed**: Environment variables might not be available during module import
- **Impact**: Clients crashed during initialization before requests could be handled

### **Issue 4: Complex File Structure**
- **Problem**: Separate `app_vercel.py` in root, importing into `api/index.py`
- **Why it failed**: Vercel expects everything needed in the `api/` directory
- **Impact**: Path resolution issues and module loading failures

## The Fix

### ✅ What I Changed:

1. **Consolidated Code** - Moved ALL code directly into `api/index.py`
   - No more imports from parent directory
   - Self-contained serverless function

2. **Lazy Client Initialization** - Clients created only when needed
   ```python
   def get_groq_client():
       return Groq(api_key=os.environ.get("GROQ_API_KEY"))
   ```
   - Ensures env vars are available
   - Creates fresh clients for each request

3. **Direct Environment Variables** - Using `os.environ.get()`
   - No `load_dotenv()` needed
   - Works with Vercel's environment variable system

4. **Proper Flask Paths** - Set template and static folder paths
   ```python
   app = Flask(__name__,
               template_folder='../templates',
               static_folder='../static')
   ```

## How Vercel Serverless Works

### Key Concepts:

1. **Serverless Functions** = Each request is a fresh execution
   - No persistent state between requests
   - Cold starts when function hasn't run recently
   - Environment variables loaded from Vercel dashboard

2. **File Structure** = Vercel looks for files in `api/` directory
   - `api/index.py` becomes the main entry point
   - Must export Flask `app` variable
   - Can access parent directories for static files/templates

3. **No Threading** = Background threads don't work
   - Each function execution must complete synchronously
   - Can't use `Thread()` or background tasks
   - Must return response within timeout (10s hobby, 60s pro)

## Deployment Steps

### 1. Ensure Environment Variables Are Set in Vercel

**CRITICAL:** Before deploying, add these in Vercel Dashboard:

1. Go to: `Project → Settings → Environment Variables`
2. Add:
   - `GROQ_API_KEY` = your Groq API key
   - `TAVILY_API_KEY` = your Tavily API key
3. Apply to: **Production, Preview, and Development**

### 2. Deploy

```bash
# Commit all changes
git add .
git commit -m "Fix Vercel serverless deployment"
git push

# Vercel will auto-deploy if connected to GitHub
# OR use Vercel CLI:
vercel --prod
```

### 3. Test Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/health`
   - Should return:
     ```json
     {
       "status": "ok",
       "groq_key_set": true,
       "tavily_key_set": true
     }
     ```
   - If keys show `false`, environment variables aren't set

2. **Homepage**: Visit `https://your-app.vercel.app/`
   - Should load the UI

3. **Analysis**: Enter a company name and submit
   - Will take 30-60 seconds (this is normal)
   - All 4 agents run sequentially
   - Results appear when complete

## Common Issues & Solutions

### Still Getting 500 Error?

**Check Vercel Logs:**
1. Go to Vercel Dashboard → Deployments → Click latest deployment
2. Click "Functions" tab
3. Look at error logs for exact Python traceback

**Common Causes:**
- Environment variables not set → Add them in dashboard
- Missing dependencies → Check `requirements.txt`
- Import errors → Check Python path issues

### Timeout Errors (504)?

**Cause**: Analysis takes longer than Vercel's timeout
- Hobby plan: 10 seconds
- Pro plan: 60 seconds

**Solution**:
- Upgrade to Vercel Pro ($20/month)
- OR reduce `max_tokens` in API calls
- OR reduce number of search results

### Module Import Errors?

**Cause**: Path resolution issues

**Solution**: All code should be in `api/index.py` now (already fixed)

## Files in This Project

### For Vercel:
- ✅ `api/index.py` - Main serverless function (ALL code here)
- ✅ `requirements.txt` - Python dependencies
- ✅ `vercel.json` - Vercel configuration
- ✅ `templates/index.html` - Frontend HTML
- ✅ `static/script_vercel.js` - Frontend JavaScript
- ✅ `static/style.css` - Styling

### For Local Development:
- `app.py` - Local Flask app with threading (better UX)
- `static/script.js` - Local JavaScript with polling

### Not Used on Vercel:
- ❌ `app_vercel.py` - Replaced by `api/index.py`
- ❌ `.env` - Use Vercel environment variables instead

## Performance Notes

### Expected Behavior:
- **Cold Start**: 2-5 seconds (first request after idle)
- **Analysis Time**: 30-60 seconds total
  - Researcher: ~10s (Tavily search + LLM)
  - Financial: ~10s (Tavily search + LLM)
  - Strategic: ~10s (LLM synthesis)
  - Writer: ~10s (Final report generation)

### User Experience:
- Loading state shown during processing
- No progress updates (synchronous)
- All results appear at once when done

## Success Checklist

- [ ] Environment variables added in Vercel dashboard
- [ ] Code deployed and build succeeded
- [ ] `/health` endpoint returns `"status": "ok"`
- [ ] `/health` shows both API keys as `true`
- [ ] Homepage loads without errors
- [ ] Can submit company analysis
- [ ] Analysis completes and shows results

If all checked, deployment is successful! 🎉
