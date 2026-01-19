# 🚀 Complete Deployment Guide

Deploy your e-commerce platform to **Render** (backend) and **Vercel** (frontend).

**Time Required:** 15-20 minutes

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account (free)
- ✅ Render account (free tier available)
- ✅ Vercel account (free tier available)
- ✅ Supabase account with database setup
- ✅ Paystack account for payments
- ✅ Email service (Resend/SendGrid) optional

---

## 🗂️ Deployment Overview

```
┌─────────────────────────────────────────────┐
│           Your E-commerce Platform          │
├─────────────────┬───────────────────────────┤
│   Frontend      │      Backend              │
│   (Vercel)      │      (Render)             │
├─────────────────┼───────────────────────────┤
│ React + Vite    │ FastAPI + Python          │
│ Static Hosting  │ Web Service               │
│ Global CDN      │ Always-on (paid)          │
│ Auto SSL        │ Auto SSL                  │
│ Free Forever    │ Free Tier Available       │
└─────────────────┴───────────────────────────┘
           │                    │
           └────────┬───────────┘
                    │
           ┌────────▼────────┐
           │   Supabase      │
           │   PostgreSQL    │
           └─────────────────┘
```

---

## 🎯 Part 1: Backend Deployment (Render)

### Step 1: Prepare Backend

**1.1 Ensure all files are committed:**
```bash
cd /home/grejoy/Projects/BodyAura-Website
git add .
git commit -m "Prepare for deployment"
git push origin main
```

**1.2 Verify `backend/render.yaml` exists** ✅ (Already configured)

**1.3 Verify `backend/requirements.txt` exists** ✅ (Already configured)

### Step 2: Deploy to Render

**2.1 Create Render Account:**
- Go to https://render.com
- Sign up with GitHub
- Authorize Render to access your repositories

**2.2 Create New Web Service:**
```
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select: "BodyAura-Website"
4. Configure:
   ├─ Name: grejoy-health-api
   ├─ Region: Frankfurt (closest to Ghana)
   ├─ Branch: main
   ├─ Root Directory: backend
   ├─ Runtime: Python 3
   ├─ Build Command: pip install -r requirements.txt
   └─ Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**2.3 Set Environment Variables:**

Go to your service → Environment → Add environment variables:

| Variable | Value | Note |
|----------|-------|------|
| `PYTHON_VERSION` | `3.11.0` | Python version |
| `ENVIRONMENT` | `production` | Environment mode |
| `SUPABASE_URL` | `your-project.supabase.co` | From Supabase dashboard |
| `SUPABASE_KEY` | `eyJ...` | Supabase anon key |
| `JWT_SECRET_KEY` | `[Generate]` | Click "Generate Value" |
| `JWT_ALGORITHM` | `HS256` | Keep default |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token lifetime |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` | From Paystack |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` | From Paystack |
| `EMAIL_API_KEY` | `re_...` | Resend API key (optional) |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Sender email (optional) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Frontend URL (add after deploying frontend) |

**Where to get these values:**

**Supabase:**
```
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy "Project URL" and "anon public" key
```

**Paystack:**
```
1. Go to https://dashboard.paystack.com
2. Settings → API Keys & Webhooks
3. Copy "Test Secret Key" and "Test Public Key"
4. For production: Use Live keys
```

**Email (Optional - Resend):**
```
1. Go to https://resend.com
2. API Keys → Create API Key
3. Copy the key
```

**2.4 Deploy:**
```
1. Click "Create Web Service"
2. Wait 2-3 minutes for build
3. Service will be live at: https://grejoy-health-api.onrender.com
```

**2.5 Verify Deployment:**
```bash
# Test health endpoint
curl https://grejoy-health-api.onrender.com/api/health

# Should return:
# {"status":"healthy","environment":"production"}

# Test API docs
open https://grejoy-health-api.onrender.com/api/docs
```

### Step 3: Backend Post-Deployment

**3.1 Setup Database:**

Run these SQL files in your Supabase SQL editor:

```sql
-- 1. Run schema.sql first
-- 2. Run 01_add_product_tracking_columns.sql
-- 3. Run 02_enhanced_recommendations.sql
```

**3.2 Configure Webhook (Paystack):**
```
1. Go to Paystack Dashboard
2. Settings → Webhooks
3. Add webhook URL:
   https://grejoy-health-api.onrender.com/api/payments/webhook
4. Save
```

**3.3 Test Admin Access:**
```bash
# Create admin user via API or database
# Then test login at:
curl -X POST https://grejoy-health-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your-password"}'
```

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

**1.1 Commit Vercel configuration:** ✅ (Just created)
```bash
cd /home/grejoy/Projects/BodyAura-Website
git add frontend/vercel.json frontend/.env.production
git commit -m "Add Vercel configuration"
git push origin main
```

**1.2 Verify build works locally:**
```bash
cd frontend
npm install
npm run build
npm run preview  # Test production build

# Should open at http://localhost:4173
```

### Step 2: Deploy to Vercel

**2.1 Create Vercel Account:**
- Go to https://vercel.com
- Sign up with GitHub
- Authorize Vercel

**2.2 Import Project:**
```
1. Click "Add New..." → "Project"
2. Import Git Repository
3. Select: "BodyAura-Website"
4. Configure:
   ├─ Framework Preset: Vite
   ├─ Root Directory: frontend
   ├─ Build Command: npm run build
   ├─ Output Directory: dist
   └─ Install Command: npm install
```

**2.3 Set Environment Variable:**

Add environment variable in Vercel:

| Variable | Value | Note |
|----------|-------|------|
| `VITE_API_URL` | `https://grejoy-health-api.onrender.com` | Your Render backend URL |

**To add:**
```
1. Project Settings → Environment Variables
2. Add: VITE_API_URL
3. Value: Your Render backend URL
4. Environment: Production, Preview, Development (select all)
5. Save
```

**2.4 Deploy:**
```
1. Click "Deploy"
2. Wait 1-2 minutes
3. Your site will be live at: https://your-project.vercel.app
```

**2.5 Add Custom Domain (Optional):**
```
1. Project Settings → Domains
2. Add your domain: www.yourdomain.com
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)
```

### Step 3: Frontend Post-Deployment

**3.1 Update Backend CORS:**

Go back to Render and update `FRONTEND_URL`:
```
Environment → FRONTEND_URL → Edit
Value: https://your-project.vercel.app
Save
```

**3.2 Test Frontend:**
```
1. Visit: https://your-project.vercel.app
2. Browse products ✅
3. Try signup/login ✅
4. Add to cart ✅
5. Test checkout ✅
6. Verify payments work ✅
```

**3.3 Mobile Testing:**

Test on your phone:
```
1. Open mobile browser
2. Visit your Vercel URL
3. Test all features
4. Verify responsive design works
```

---

## 🔄 Part 3: Continuous Deployment Setup

### Backend (Render)

**Auto-deploy on push:**
```
Render automatically deploys when you push to main branch:

1. Make changes locally
2. git add .
3. git commit -m "Update feature"
4. git push origin main
5. Render rebuilds automatically (2-3 min)
```

**Manual deploy:**
```
Render Dashboard → Your Service → Manual Deploy → Deploy latest commit
```

### Frontend (Vercel)

**Auto-deploy on push:**
```
Vercel automatically deploys when you push:

1. Make changes locally
2. git add .
3. git commit -m "Update UI"
4. git push origin main
5. Vercel rebuilds automatically (1-2 min)
```

**Preview deployments:**
```
Every branch gets a preview URL:
1. Create branch: git checkout -b feature/new-thing
2. Push: git push origin feature/new-thing
3. Vercel creates: https://your-project-git-feature-new-thing.vercel.app
4. Test before merging to main
```

---

## 🔒 Part 4: Security Checklist

### Before Going Live:

- [ ] **Change Paystack to Live keys** (not test keys)
- [ ] **Use strong JWT_SECRET_KEY** (auto-generated by Render)
- [ ] **Enable Supabase RLS** (Row Level Security)
- [ ] **Add custom domain** with SSL
- [ ] **Set up monitoring** (Render + Vercel have built-in)
- [ ] **Configure error tracking** (optional: Sentry)
- [ ] **Set up backups** (Supabase auto-backup enabled)
- [ ] **Review CORS settings** (only allow your domain)
- [ ] **Enable rate limiting** (built into FastAPI)
- [ ] **Test payment flow** thoroughly

---

## 📊 Part 5: Monitoring & Maintenance

### Render Monitoring

**Check service health:**
```
Dashboard → Your Service → Metrics
- CPU Usage
- Memory Usage
- Response Time
- Request Count
```

**View logs:**
```
Dashboard → Your Service → Logs
- Real-time logs
- Filter by severity
- Download logs
```

**Alerts:**
```
Settings → Alerts
- Set up email alerts
- CPU/Memory thresholds
- Deploy success/failure
```

### Vercel Monitoring

**Analytics:**
```
Project → Analytics
- Pageviews
- Top pages
- Devices
- Countries
```

**Performance:**
```
Project → Speed Insights
- Core Web Vitals
- Performance score
- Real user metrics
```

**Logs:**
```
Project → Logs
- Function logs
- Build logs
- Error logs
```

---

## 🐛 Part 6: Troubleshooting

### Backend Issues

**Issue: Service won't start**
```
Solution:
1. Check Render logs
2. Verify all environment variables set
3. Test requirements.txt locally
4. Check Python version matches
```

**Issue: Database connection failed**
```
Solution:
1. Verify SUPABASE_URL is correct
2. Check SUPABASE_KEY is anon key (not service key)
3. Test connection from local machine
4. Check Supabase project is active
```

**Issue: 503 Service Unavailable**
```
Solution:
1. Render free tier sleeps after inactivity
2. First request takes 30-60 seconds
3. Upgrade to paid tier for always-on
4. Or accept cold starts
```

### Frontend Issues

**Issue: API calls fail (CORS)**
```
Solution:
1. Check VITE_API_URL is set correctly
2. Verify backend FRONTEND_URL matches
3. Check browser console for errors
4. Test API directly first
```

**Issue: Build fails**
```
Solution:
1. Check Vercel build logs
2. Run npm run build locally
3. Fix TypeScript errors
4. Verify all dependencies installed
```

**Issue: Environment variables not working**
```
Solution:
1. Prefix with VITE_
2. Redeploy after adding variables
3. Check they're set for all environments
4. Clear Vercel cache and rebuild
```

---

## 💰 Part 7: Cost Estimates

### Free Tier (Getting Started)

| Service | Plan | Cost | Limitations |
|---------|------|------|-------------|
| **Render** | Free | $0/month | - Service sleeps after 15min inactivity<br>- 750 hours/month<br>- Cold starts (30-60s) |
| **Vercel** | Hobby | $0/month | - 100 GB bandwidth/month<br>- 100 builds/day<br>- All features included |
| **Supabase** | Free | $0/month | - 500MB database<br>- 2GB bandwidth<br>- 50,000 monthly active users |
| **Paystack** | Free | 1.5% + ₵0.50 | - Per successful transaction |

**Total Free:** $0/month + transaction fees

**Good for:** Testing, MVP, low traffic (< 1000 users)

### Recommended Production (Small Business)

| Service | Plan | Cost | Benefits |
|---------|------|------|----------|
| **Render** | Starter | $7/month | - Always-on<br>- No cold starts<br>- 512MB RAM |
| **Vercel** | Pro | $20/month | - Better performance<br>- Team features<br>- Advanced analytics |
| **Supabase** | Pro | $25/month | - 8GB database<br>- 250GB bandwidth<br>- Daily backups |
| **Paystack** | Free | 1.5% + ₵0.50 | - No monthly fee |

**Total:** ~$52/month + transaction fees

**Good for:** 1,000-10,000 active users, serious business

### Enterprise (High Traffic)

| Service | Plan | Cost |
|---------|------|------|
| **Render** | Standard | $25-85/month |
| **Vercel** | Enterprise | $250+/month |
| **Supabase** | Team | $599/month |

**Good for:** 50,000+ users, high availability requirements

---

## 🚀 Part 8: Quick Start Commands

### Deploy Everything (First Time)

```bash
# 1. Prepare code
cd /home/grejoy/Projects/BodyAura-Website
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Deploy Backend (via Render Dashboard)
# - Create web service
# - Connect GitHub repo
# - Set environment variables
# - Deploy

# 3. Deploy Frontend (via Vercel Dashboard)
# - Import GitHub repo
# - Set VITE_API_URL
# - Deploy

# 4. Test
curl https://your-backend.onrender.com/api/health
open https://your-frontend.vercel.app
```

### Update Backend

```bash
# Make changes
cd /home/grejoy/Projects/BodyAura-Website/backend
# ... edit files ...

# Deploy
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys (2-3 min)
```

### Update Frontend

```bash
# Make changes
cd /home/grejoy/Projects/BodyAura-Website/frontend
# ... edit files ...

# Deploy
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys (1-2 min)
```

---

## 📚 Part 9: Additional Resources

### Documentation

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Paystack Docs:** https://paystack.com/docs

### Support

- **Render Support:** support@render.com
- **Vercel Support:** support@vercel.com
- **Supabase Support:** Discord community
- **Paystack Support:** support@paystack.com

### Useful Tools

- **Database GUI:** https://app.supabase.com (SQL editor)
- **API Testing:** https://hoppscotch.io
- **Monitoring:** Built into Render + Vercel
- **SSL Test:** https://www.ssllabs.com/ssltest/

---

## ✅ Deployment Checklist

Copy this checklist and check off as you go:

### Pre-Deployment
- [ ] Code committed to GitHub
- [ ] Supabase database created
- [ ] Supabase tables created (run SQL migrations)
- [ ] Paystack account created
- [ ] All secrets ready

### Backend Deployment
- [ ] Render account created
- [ ] Web service created
- [ ] Environment variables set
- [ ] Backend deployed successfully
- [ ] Health check passes
- [ ] API docs accessible
- [ ] Test endpoints work

### Frontend Deployment
- [ ] Vercel account created
- [ ] Project imported
- [ ] VITE_API_URL set
- [ ] Frontend deployed successfully
- [ ] Site loads correctly
- [ ] API calls work
- [ ] Auth flow works
- [ ] Payments work

### Post-Deployment
- [ ] Backend FRONTEND_URL updated
- [ ] Paystack webhook configured
- [ ] Test on mobile device
- [ ] Test all user flows
- [ ] Monitor for errors
- [ ] Set up alerts

### Optional Enhancements
- [ ] Custom domain added
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Error tracking (Sentry)
- [ ] Backup strategy
- [ ] Monitoring alerts

---

## 🎉 Success!

If you've followed this guide, your e-commerce platform is now live!

**Your URLs:**
- **Frontend:** https://your-project.vercel.app
- **Backend:** https://your-service.onrender.com
- **API Docs:** https://your-service.onrender.com/api/docs

**Next Steps:**
1. Test thoroughly
2. Add products
3. Create admin user
4. Share with test users
5. Monitor performance
6. Iterate and improve

**Need help?** Check the troubleshooting section or create an issue on GitHub.

---

**Congratulations on deploying your e-commerce platform!** 🚀🎊
