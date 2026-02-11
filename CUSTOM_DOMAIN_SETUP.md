# Custom Domain Setup Guide for api.myxcrow.com

**Issue:** `api.myxcrow.com` returns `ERR_NAME_NOT_RESOLVED` because DNS is not configured.

**Current Status:**
- ✅ `myxcrow.com` → Working (resolves to 216.24.57.1)
- ❌ `api.myxcrow.com` → Not configured (NXDOMAIN)
- ✅ `myxcrow-bp-api.onrender.com` → Working (Render subdomain)

## Quick Fix (Already Applied)

I've reverted the API URL in `render.yaml` to use the Render subdomain:
```yaml
NEXT_PUBLIC_API_BASE_URL: https://myxcrow-bp-api.onrender.com/api
```

**Push this change to fix the immediate issue:**
```bash
git push origin main
```

## To Set Up Custom Domain (api.myxcrow.com)

Follow these steps to properly configure `api.myxcrow.com`:

### Step 1: Add Custom Domain in Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **myxcrow-bp-api** service
3. Go to **Settings** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter: `api.myxcrow.com`
6. Render will show you the DNS target (something like `myxcrow-bp-api.onrender.com`)

### Step 2: Configure DNS Records

Go to your domain registrar (where you bought myxcrow.com) and add a CNAME record:

**CNAME Record:**
- **Type:** CNAME
- **Name:** `api` (or `api.myxcrow.com` depending on your registrar)
- **Value:** `myxcrow-bp-api.onrender.com` (use the exact value Render shows you)
- **TTL:** 3600 (or Auto)

### Step 3: Wait for DNS Propagation

DNS changes can take:
- **5-30 minutes** (typical)
- **Up to 48 hours** (worst case)

**Check DNS propagation:**
```bash
nslookup api.myxcrow.com
```

You should see it resolve to an IP address instead of `NXDOMAIN`.

### Step 4: Verify SSL Certificate

After DNS propagates:
1. Render will automatically provision an SSL certificate
2. Check in Render Dashboard → Custom Domains
3. Wait for the certificate status to show "Active"

### Step 5: Update render.yaml

Once DNS is working and SSL is active, update `render.yaml`:

```yaml
- key: NEXT_PUBLIC_API_BASE_URL
  value: https://api.myxcrow.com/api
```

Then commit and push:
```bash
git add render.yaml
git commit -m "chore: switch to custom domain api.myxcrow.com"
git push origin main
```

## Verification

After setup, test these URLs:

1. **API Health Check:**
   ```bash
   curl https://api.myxcrow.com/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Web App:**
   - Visit https://www.myxcrow.com
   - Open browser console
   - Should see API calls going to `api.myxcrow.com` instead of `myxcrow-bp-api.onrender.com`

## Troubleshooting

### DNS Not Resolving
```bash
# Check if DNS is configured
nslookup api.myxcrow.com

# Check from different DNS server
nslookup api.myxcrow.com 8.8.8.8
```

### SSL Certificate Issues
- Wait for DNS to fully propagate first
- Check Render Dashboard for certificate status
- May take 10-15 minutes after DNS propagates

### Still Getting Errors
1. Clear browser cache
2. Try incognito/private browsing
3. Check Render logs for any errors

## Current Workaround

Until you set up the custom domain, the app will use:
- **API:** `https://myxcrow-bp-api.onrender.com/api`
- **Web:** `https://www.myxcrow.com`

This works perfectly fine! The custom domain is just for branding.
