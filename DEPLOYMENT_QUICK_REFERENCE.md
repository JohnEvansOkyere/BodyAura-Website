# 🚀 Deployment Quick Reference Card

**Print this and keep it handy!**

---

## 📋 Your Deployment URLs

```
┌─────────────────────────────────────────────────────┐
│              DEPLOYMENT INFORMATION                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend (Vercel):                                │
│  https://_____________________.vercel.app          │
│                                                     │
│  Backend (Render):                                 │
│  https://_____________________.onrender.com        │
│                                                     │
│  API Docs:                                         │
│  https://_____________________.onrender.com/api/docs│
│                                                     │
│  Database (Supabase):                              │
│  https://_____________________.supabase.co         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Commands

### Push Code
```bash
git add .
git commit -m "Your message"
git push origin main
# Auto-deploys to Render + Vercel ✅
```

### Test Local
```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend  
cd frontend && npm run dev
```

### Check Deployment
```bash
# Backend health
curl https://YOUR-BACKEND.onrender.com/api/health

# Should return: {"status":"healthy","environment":"production"}
```

---

## 🔑 Environment Variables

### Backend (Render)

| Variable | Value | Get From |
|----------|-------|----------|
| `SUPABASE_URL` | https://xxx.supabase.co | Supabase Dashboard |
| `SUPABASE_KEY` | eyJ... | Supabase Dashboard |
| `JWT_SECRET_KEY` | [Generate] | Render auto-generate |
| `PAYSTACK_SECRET_KEY` | sk_test_... | Paystack Dashboard |
| `PAYSTACK_PUBLIC_KEY` | pk_test_... | Paystack Dashboard |
| `FRONTEND_URL` | https://xxx.vercel.app | Your Vercel URL |

### Frontend (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | https://xxx.onrender.com |

---

## 🔗 Important Links

### Dashboards
- **Render:** https://dashboard.render.com
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://app.supabase.com
- **Paystack:** https://dashboard.paystack.com

### Your Repositories
- **GitHub Repo:** https://github.com/YOUR-USERNAME/BodyAura-Website
- **Documentation:** Check `/docs` folder in repo

---

## 📱 Test Checklist

Quick test after deployment:

- [ ] Frontend loads without errors
- [ ] Products show up
- [ ] Can sign up/login
- [ ] Can add to cart
- [ ] Checkout works
- [ ] Payment initializes
- [ ] Admin panel accessible
- [ ] Mobile responsive works

---

## 🐛 Quick Troubleshooting

### Backend 503 Error
```
Render free tier sleeps after 15min
First request takes 30-60 seconds
Solution: Wait or upgrade to Starter ($7/mo)
```

### CORS Error
```
Check FRONTEND_URL in Render matches exactly
Wait for service restart (30 seconds)
Hard refresh browser (Ctrl+Shift+R)
```

### Build Failed
```
Check Render/Vercel logs
Verify all environment variables set
Test build locally first
```

---

## 📞 Get Help

### Documentation
- **Quick Start:** `DEPLOYMENT_QUICK_START.md`
- **Complete Guide:** `DEPLOYMENT_GUIDE.md`
- **Environment Vars:** `ENV_VARIABLES_GUIDE.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`

### Support
- **Render:** support@render.com
- **Vercel:** support@vercel.com
- **Supabase:** Discord community
- **Paystack:** support@paystack.com

---

## 🎯 Common Tasks

### Add Environment Variable
```
Render: Dashboard → Service → Environment → Add
Vercel: Project → Settings → Environment Variables
(Requires redeploy for changes)
```

### View Logs
```
Render: Dashboard → Service → Logs
Vercel: Project → Deployments → Click deployment → Function Logs
```

### Redeploy
```
Render: Manual Deploy button OR push to main
Vercel: Redeploy button OR push to main
```

### Update Domain
```
Vercel: Project → Settings → Domains → Add
(DNS configuration required)
```

---

## 💰 Cost Reference

### Free Tier (Current)
- **Render:** Free (sleeps after 15min)
- **Vercel:** Free forever
- **Supabase:** Free (500MB DB)
- **Paystack:** 1.5% + ₵0.50 per transaction

**Total:** $0/month + transaction fees

### Recommended Production
- **Render Starter:** $7/month (always-on)
- **Vercel Pro:** $20/month (better perf)
- **Supabase Pro:** $25/month (8GB DB)

**Total:** ~$52/month + transaction fees

---

## 📊 Monitoring

### Check Status
- **Render:** Green = Good, Red = Issue
- **Vercel:** Check Analytics for traffic
- **Supabase:** Check Database usage

### Set Alerts
- **Render:** Settings → Alerts
- **Vercel:** Integrated monitoring
- **Supabase:** Dashboard shows usage

---

## 🔐 Security Reminders

- ✅ Use HTTPS (automatic)
- ✅ Strong JWT secret (auto-generated)
- ✅ Test keys initially, live keys for production
- ✅ Never commit .env files
- ✅ Rotate keys periodically

---

## 📈 Next Steps After Deployment

1. **Test Everything** - All features work?
2. **Add Products** - Via admin panel
3. **Create Admin** - First admin user
4. **Test Payments** - Use Paystack test cards
5. **Go Live** - Switch to live Paystack keys
6. **Monitor** - Check logs daily
7. **Scale** - Upgrade as traffic grows

---

## 🎉 Deployment Status

Fill this in after deploying:

```
Deployment Date: ___________________

Backend Deployed: ☐ Yes  ☐ No
Frontend Deployed: ☐ Yes  ☐ No
Database Setup: ☐ Yes  ☐ No
Environment Variables: ☐ Yes  ☐ No
Webhook Configured: ☐ Yes  ☐ No
Admin User Created: ☐ Yes  ☐ No
Test Products Added: ☐ Yes  ☐ No
Mobile Tested: ☐ Yes  ☐ No

Status: ☐ Live  ☐ Testing  ☐ Issues

Notes:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 📞 Emergency Contacts

```
Developer: Evans
Company: VexaAI
Location: Ghana

Render Support: support@render.com
Vercel Support: support@vercel.com
Paystack Support: support@paystack.com
```

---

**Keep this card handy for quick reference!** 🚀

**Deploy with confidence!** ✅
