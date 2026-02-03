# Domain Configuration for myxcrow.com

**Domain:** `myxcrow.com`  
**Deployment Platform:** Coolify on VPS

---

## 🌐 DNS Records Required

Configure these DNS A records in your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

### Required Records

1. **Main Domain (Web App)**
   - **Type:** A Record
   - **Name:** `@` (or `myxcrow.com`)
   - **Value:** Your VPS IP address
   - **TTL:** 300 (or default)

2. **API Subdomain**
   - **Type:** A Record
   - **Name:** `api`
   - **Value:** Your VPS IP address
   - **TTL:** 300 (or default)

### Optional Records

3. **WWW Subdomain (Optional)**
   - **Type:** A Record (or CNAME)
   - **Name:** `www`
   - **Value:** Your VPS IP address (or CNAME to `myxcrow.com`)
   - **TTL:** 300 (or default)

---

## 📋 DNS Configuration Summary

| Record Type | Name | Value | Purpose |
|------------|------|-------|---------|
| A | `@` | VPS IP | Main web application (`myxcrow.com`) |
| A | `api` | VPS IP | API service (`api.myxcrow.com`) |
| A/CNAME | `www` | VPS IP or `myxcrow.com` | WWW redirect (optional) |

---

## ✅ Verification

After configuring DNS, verify with these commands:

```bash
# Check main domain
dig myxcrow.com +short
# Should return your VPS IP

# Check API subdomain
dig api.myxcrow.com +short
# Should return your VPS IP

# Check www (if configured)
dig www.myxcrow.com +short
# Should return your VPS IP or CNAME
```

Or use online tools:
- https://dnschecker.org
- https://www.whatsmydns.net

**Note:** DNS propagation can take 5-10 minutes (or up to 48 hours in rare cases).

---

## 🔒 SSL Certificates

Coolify will automatically generate SSL certificates via Let's Encrypt once:
1. DNS records are configured and propagated
2. Domains are added in Coolify dashboard
3. Ports 80 and 443 are open on your VPS

**No manual SSL configuration needed!** Coolify handles everything automatically.

---

## 🌍 Environment Variables

Once DNS is configured, use these domains in your Coolify environment variables:

### API Service (`myxcrow-api`)
```bash
WEB_APP_URL=https://myxcrow.com
```

### Web Service (`myxcrow-web`)
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api
```

---

## 📝 Coolify Domain Configuration

### API Service
1. Go to `myxcrow-api` application in Coolify
2. Click **"Domains"** tab
3. Add domain: `api.myxcrow.com`
4. Enable **"Generate SSL Certificate"**
5. Save

### Web Service
1. Go to `myxcrow-web` application in Coolify
2. Click **"Domains"** tab
3. Add domain: `myxcrow.com`
4. Optional: Add `www.myxcrow.com` and set redirect to `myxcrow.com`
5. Enable **"Generate SSL Certificate"**
6. Save

---

## 🐛 Troubleshooting

### DNS Not Resolving

**Issue:** Domain doesn't resolve to your VPS IP

**Solutions:**
1. Verify DNS records are correct in your registrar
2. Wait 5-10 minutes for DNS propagation
3. Clear DNS cache: `sudo systemd-resolve --flush-caches` (Linux) or `ipconfig /flushdns` (Windows)
4. Check with `dig` or `nslookup` from different locations

### SSL Certificate Fails

**Issue:** SSL certificate generation fails in Coolify

**Solutions:**
1. Verify DNS A records point to your VPS IP
2. Ensure ports 80 and 443 are open in firewall
3. Wait for DNS propagation (can take up to 48 hours)
4. Check Coolify logs for specific error messages
5. Verify domain is accessible via HTTP before enabling SSL

### Domain Points to Wrong IP

**Issue:** Domain resolves but points to old IP or wrong server

**Solutions:**
1. Double-check DNS records in your registrar
2. Clear DNS cache
3. Wait for DNS propagation
4. Verify with `dig myxcrow.com` from multiple locations

---

## 📞 Need Help?

1. Check your domain registrar's DNS documentation
2. Verify VPS IP address is correct
3. Use DNS checker tools to verify propagation
4. Review Coolify logs for SSL certificate errors
5. Check firewall rules (ports 80/443 must be open)

---

## ✅ Checklist

- [ ] DNS A record for `myxcrow.com` → VPS IP
- [ ] DNS A record for `api.myxcrow.com` → VPS IP
- [ ] DNS propagation verified (5-10 minutes)
- [ ] Domain added in Coolify for API service
- [ ] Domain added in Coolify for Web service
- [ ] SSL certificate generation enabled
- [ ] SSL certificates verified (green lock in browser)
- [ ] Environment variables updated with correct domains

---

**Last Updated:** January 2026
