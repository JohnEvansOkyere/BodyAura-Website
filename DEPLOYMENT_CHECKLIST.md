# ✅ Deployment Checklist

Use this checklist to deploy your e-commerce platform step-by-step.

---

## 📋 Pre-Deployment Checklist

### Code Ready
- [ ] All code committed to Git
- [ ] No console.log() in production code
- [ ] All tests passing (if you have tests)
- [ ] Code pushed to GitHub main branch

### Accounts Created
- [ ] GitHub account (free)
- [ ] Render account (free)
- [ ] Vercel account (free)
- [ ] Supabase account (free)
- [ ] Paystack account (free)
- [ ] Email service account (optional - Resend)

### Credentials Ready
- [ ] Supabase URL
- [ ] Supabase anon key
- [ ] Paystack test secret key
- [ ] Paystack test public key
- [ ] Email API key (optional)

---

## 🗄️ Database Setup

### Supabase Configuration
- [ ] Supabase project created
- [ ] Database password saved
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] RLS policies reviewed (optional)

### Run SQL Migrations
Run these in order in Supabase SQL Editor:

- [ ] `database/schema.sql` - Main tables
- [ ] `database/01_add_product_tracking_columns.sql` - Product tracking
- [ ] `database/02_enhanced_recommendations.sql` - Recommendations

### Verify Database
- [ ] Tables created successfully
- [ ] No SQL errors
- [ ] Can query tables

---

## 🔧 Backend Deployment (Render)

### Create Service
- [ ] Render account signed in
- [ ] Repository connected
- [ ] New Web Service created
- [ ] Repository selected

### Configure Service
- [ ] Name: `grejoy-health-api`
- [ ] Region: Frankfurt (or closest)
- [ ] Branch: `main`
- [ ] Root Directory: `backend`
- [ ] Runtime: Python 3
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Plan selected (Free or Starter)

### Environment Variables Added
Required:
- [ ] `PYTHON_VERSION` = `3.11.0`
- [ ] `ENVIRONMENT` = `production`
- [ ] `SUPABASE_URL` = Your Supabase URL
- [ ] `SUPABASE_KEY` = Your anon key
- [ ] `JWT_SECRET_KEY` = [Generated]
- [ ] `JWT_ALGORITHM` = `HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` = `30`
- [ ] `PAYSTACK_SECRET_KEY` = Your secret key
- [ ] `PAYSTACK_PUBLIC_KEY` = Your public key

Optional (add later):
- [ ] `EMAIL_API_KEY` = Your email key
- [ ] `EMAIL_FROM` = Your sender email
- [ ] `FRONTEND_URL` = [Add after frontend deployed]

### Deploy & Verify
- [ ] Service deployed (2-3 min wait)
- [ ] Build succeeded (no errors)
- [ ] Service is running
- [ ] URL copied: `https://________.onrender.com`

### Test Backend
- [ ] Health check works: `/api/health`
- [ ] API docs load: `/api/docs`
- [ ] Can access endpoints
- [ ] No 500 errors in logs

---

## 🎨 Frontend Deployment (Vercel)

### Import Project
- [ ] Vercel account signed in
- [ ] New Project clicked
- [ ] GitHub connected
- [ ] Repository imported

### Configure Build
- [ ] Framework: Vite detected
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### Environment Variables
- [ ] `VITE_API_URL` added
- [ ] Value: Your Render backend URL
- [ ] Applied to: Production, Preview, Development (all 3)
- [ ] Saved

### Deploy & Verify
- [ ] Deployment started
- [ ] Build succeeded (1-2 min)
- [ ] Site is live
- [ ] URL copied: `https://________.vercel.app`

### Test Frontend
- [ ] Site loads without errors
- [ ] No console errors in browser
- [ ] Can see products
- [ ] Images load correctly
- [ ] Styles look good

---

## 🔗 Connect Backend & Frontend

### Update Backend CORS
- [ ] Opened Render dashboard
- [ ] Navigated to service → Environment
- [ ] Added/Updated `FRONTEND_URL`
- [ ] Value: Your Vercel URL
- [ ] Saved (service restarted)

### Test Connection
- [ ] Frontend can call backend API
- [ ] No CORS errors in console
- [ ] Products load from API
- [ ] Login/signup works

---

## 🧪 Test All Features

### Authentication
- [ ] Can sign up new user
- [ ] Can log in existing user
- [ ] Can log out
- [ ] Protected routes work
- [ ] JWT tokens working

### Products
- [ ] Products list loads
- [ ] Product details modal works
- [ ] Product images display
- [ ] Search works
- [ ] Filters work
- [ ] Categories work

### Cart
- [ ] Can add to cart
- [ ] Cart count updates
- [ ] Can view cart
- [ ] Can update quantities
- [ ] Can remove items
- [ ] Cart persists

### Checkout
- [ ] Checkout form loads
- [ ] All fields work
- [ ] Validation works
- [ ] Payment methods selectable
- [ ] Can place order

### Payments
- [ ] Payment initializes
- [ ] Redirects to Paystack
- [ ] Test payment works
- [ ] Returns to site after payment
- [ ] Payment verified
- [ ] Order status updated

### Orders
- [ ] Can view orders list
- [ ] Order details load
- [ ] Order status shows correctly
- [ ] Can track orders

### Admin Panel
- [ ] Can access admin panel
- [ ] Dashboard stats show
- [ ] Can view all orders
- [ ] Can update order status
- [ ] Can add products
- [ ] Can edit products
- [ ] Can delete products

---

## 📱 Mobile Testing

### Test on Phone
- [ ] Site loads on mobile
- [ ] Responsive design works
- [ ] All buttons tappable
- [ ] Forms work on mobile
- [ ] No horizontal scroll
- [ ] Images sized correctly

### Test Key Flows
- [ ] Browse products on mobile
- [ ] Product modal opens full-screen
- [ ] Add to cart works
- [ ] Checkout form easy to fill
- [ ] Payment works on mobile

---

## 🔐 Security Checklist

### Production Readiness
- [ ] Using HTTPS (automatic)
- [ ] SSL certificates active (automatic)
- [ ] Strong JWT secret (auto-generated)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation active

### Paystack Configuration
- [ ] Using test keys initially ✅
- [ ] Will switch to live keys when ready
- [ ] Webhook URL configured

### Data Security
- [ ] Passwords hashed (bcrypt)
- [ ] JWT tokens secure
- [ ] Supabase RLS reviewed
- [ ] No sensitive data logged

---

## 📊 Post-Deployment

### Monitoring Setup
- [ ] Render alerts configured
- [ ] Vercel analytics enabled
- [ ] Error tracking (optional - Sentry)
- [ ] Uptime monitoring (optional - UptimeRobot)

### Documentation Updated
- [ ] Backend URL documented
- [ ] Frontend URL documented
- [ ] Admin credentials saved securely
- [ ] API keys saved securely

### Webhook Configuration
- [ ] Paystack webhook URL added
- [ ] Webhook tested
- [ ] Webhook logs checked

### Create Test Data
- [ ] Admin user created
- [ ] Test products added
- [ ] Test categories created
- [ ] Sample orders created

---

## 🚀 Go Live Checklist

### Before Going Live
- [ ] All features tested thoroughly
- [ ] Mobile testing complete
- [ ] Payment flow tested
- [ ] Admin panel tested
- [ ] Error handling verified

### Switch to Production
- [ ] Update Paystack to LIVE keys
- [ ] Update email to production settings
- [ ] Configure custom domain (optional)
- [ ] Enable production monitoring

### Launch
- [ ] Announce to users
- [ ] Monitor for issues
- [ ] Have support ready
- [ ] Backup plan ready

---

## 📈 Optional Enhancements

### Custom Domain
- [ ] Domain purchased
- [ ] Domain added in Vercel
- [ ] DNS configured
- [ ] SSL certificate issued
- [ ] Domain working

### Analytics
- [ ] Google Analytics added
- [ ] Vercel Analytics enabled
- [ ] Conversion tracking setup
- [ ] Monitoring dashboards

### Performance
- [ ] Lighthouse score checked (aim 90+)
- [ ] Images optimized
- [ ] Code split where needed
- [ ] CDN configured (automatic with Vercel)

### SEO
- [ ] Meta tags added
- [ ] Sitemap created
- [ ] Robots.txt configured
- [ ] Google Search Console setup

---

## ✅ Final Verification

### Everything Works
- [ ] Frontend loads fast
- [ ] Backend responds quickly
- [ ] No errors in logs
- [ ] All features functional
- [ ] Mobile experience smooth
- [ ] Payments working
- [ ] Admin panel accessible

### Documentation Complete
- [ ] Deployment documented
- [ ] URLs saved
- [ ] Credentials secure
- [ ] Team has access

### Ready to Scale
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backup strategy
- [ ] Update process documented

---

## 🎉 Congratulations!

If all items are checked, your e-commerce platform is **LIVE**! 🚀

### Your Live URLs:
- **Frontend:** https://__________.vercel.app
- **Backend:** https://__________.onrender.com
- **API Docs:** https://__________.onrender.com/api/docs

### Next Steps:
1. Monitor performance
2. Gather user feedback
3. Iterate and improve
4. Scale as needed

**Happy selling!** 🛍️💰

---

## 📚 Related Documentation

- **Quick Start:** `DEPLOYMENT_QUICK_START.md`
- **Complete Guide:** `DEPLOYMENT_GUIDE.md`
- **Environment Variables:** `ENV_VARIABLES_GUIDE.md`
- **Mobile Responsive:** `MOBILE_SUMMARY.md`

---

**Print this checklist and check items off as you go!** ✓
