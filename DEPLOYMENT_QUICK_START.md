# ⚡ Quick Deployment Guide

Deploy in **15 minutes** with this streamlined guide.

---

## 🎯 Overview

```
1. Push code to GitHub          (2 min)
2. Deploy backend to Render     (5 min)
3. Deploy frontend to Vercel    (3 min)
4. Configure & test            (5 min)
```

---

## 📝 Before You Start

Have these ready:

- [ ] GitHub account
- [ ] Supabase account + database URL & key
- [ ] Paystack test keys (secret & public)
- [ ] Code committed to GitHub

---

## 🚀 Step 1: Push to GitHub (2 min)

```bash
cd /home/grejoy/Projects/BodyAura-Website

# Commit everything
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## 🔧 Step 2: Deploy Backend - Render (5 min)

### 2.1 Create Service

1. Go to **https://render.com**
2. **Sign in** with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your repository: **"BodyAura-Website"**

### 2.2 Configure Service

```
Name: grejoy-health-api
Region: Frankfurt (Europe - closest to Ghana)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free (or Starter for always-on)
```

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```bash
# Required
PYTHON_VERSION=3.11.0
ENVIRONMENT=production
SUPABASE_URL=your-project.supabase.co
SUPABASE_KEY=eyJ... (your anon key)
JWT_SECRET_KEY=[Click "Generate Value"]
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Optional (can add later)
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=[Add after deploying frontend]
```

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes
3. Copy your URL: `https://grejoy-health-api-XXXX.onrender.com`

### 2.5 Quick Test

```bash
# Replace with your actual URL
curl https://grejoy-health-api-XXXX.onrender.com/api/health

# Should return: {"status":"healthy","environment":"production"}
```

✅ **Backend deployed!**

---

## 🎨 Step 3: Deploy Frontend - Vercel (3 min)

### 3.1 Import Project

1. Go to **https://vercel.com**
2. **Sign in** with GitHub
3. Click **"Add New..."** → **"Project"**
4. Select **"BodyAura-Website"**

### 3.2 Configure Project

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3.3 Add Environment Variable

Click **"Environment Variables"** → **"Add"**:

```
Key: VITE_API_URL
Value: https://grejoy-health-api-XXXX.onrender.com
(Your backend URL from Step 2)

Apply to: Production, Preview, Development (check all 3)
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes
3. Copy your URL: `https://your-project.vercel.app`

✅ **Frontend deployed!**

---

## 🔗 Step 4: Connect Them (2 min)

### 4.1 Update Backend CORS

Go back to Render:

1. Your service → **Environment**
2. Add/Edit: `FRONTEND_URL`
3. Value: `https://your-project.vercel.app`
4. **Save** (service will restart)

### 4.2 Test Everything

```bash
# Open your site
open https://your-project.vercel.app

# Test these:
✓ Homepage loads
✓ Products show up
✓ Can register/login
✓ Can add to cart
✓ Can checkout
```

---

## 🎉 Step 5: Final Setup (3 min)

### 5.1 Setup Supabase Database

Run these SQL files in Supabase SQL Editor:

```sql
-- 1. database/schema.sql
-- 2. database/01_add_product_tracking_columns.sql
-- 3. database/02_enhanced_recommendations.sql
```

### 5.2 Create Admin User

**Option A: Via API**
```bash
curl -X POST https://your-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "full_name": "Admin User"
  }'
```

**Option B: Via Supabase Dashboard**
```sql
-- Update a user to admin
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@yourdomain.com';
```

### 5.3 Configure Paystack Webhook

1. **Paystack Dashboard** → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-backend.onrender.com/api/payments/webhook`
3. **Save**

---

## ✅ Deployment Complete!

Your site is now live! 🎊

**Your URLs:**
- 🎨 **Frontend:** https://your-project.vercel.app
- 🔧 **Backend:** https://your-backend.onrender.com
- 📚 **API Docs:** https://your-backend.onrender.com/api/docs

---

## 📱 Mobile Test

Test on your phone:

```
1. Open browser on your phone
2. Go to: https://your-project.vercel.app
3. Test:
   ✓ Browse products
   ✓ Register account
   ✓ Add to cart
   ✓ Checkout
   ✓ Payment flow
```

---

## 🔄 How to Update

### Update Frontend
```bash
cd frontend
# Make changes...
git add .
git commit -m "Update UI"
git push origin main
# Vercel auto-deploys in 1-2 min ✅
```

### Update Backend
```bash
cd backend
# Make changes...
git add .
git commit -m "Update API"
git push origin main
# Render auto-deploys in 2-3 min ✅
```

---

## 🐛 Quick Troubleshooting

### Backend Issues

**503 Error (Service Unavailable)**
- Free tier sleeps after 15min
- First request takes 30-60s
- Solution: Upgrade to Starter ($7/mo) for always-on

**API calls fail**
- Check environment variables are set
- Verify Supabase URL/Key correct
- Check Render logs for errors

### Frontend Issues

**Blank page**
- Check browser console
- Verify VITE_API_URL is set
- Test backend directly first

**CORS errors**
- Update FRONTEND_URL in Render
- Wait for backend to restart
- Hard refresh browser (Ctrl+Shift+R)

---

## 💡 Pro Tips

### Performance
- Use **Render Starter** ($7/mo) for no cold starts
- Add custom domain in Vercel (free SSL)
- Enable Vercel Analytics

### Monitoring
- Check Render logs daily
- Monitor Vercel analytics
- Set up Render alerts

### Security
- Use **strong passwords**
- Change to **Paystack Live keys** before production
- Enable **Supabase RLS**

---

## 📚 Full Documentation

For detailed guides, see:
- **Complete Guide:** `DEPLOYMENT_GUIDE.md`
- **Backend Config:** `backend/render.yaml`
- **Frontend Config:** `frontend/vercel.json`

---

## 🆘 Need Help?

**Check logs:**
- **Render:** Dashboard → Your Service → Logs
- **Vercel:** Project → Logs
- **Browser:** F12 → Console tab

**Common issues:**
- See `DEPLOYMENT_GUIDE.md` → Troubleshooting section

---

## 🎯 Next Steps

After deployment:

1. **Add Products** - Via admin panel
2. **Test Payments** - Use Paystack test cards
3. **Share Link** - Get feedback
4. **Monitor** - Check analytics daily
5. **Optimize** - Based on user behavior

---

**Congratulations!** Your e-commerce platform is live! 🚀

Start selling in Ghana with mobile money payments! 🇬🇭💚
