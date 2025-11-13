# backend/README.md

# Grejoy Health Products - Backend API

FastAPI backend for e-commerce platform with Mobile Money integration for Ghana.

## 🚀 Quick Start (Development)
```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run development server
uvicorn app.main:app --reload
```

Visit: http://localhost:8000/api/docs

## 📦 Deployment (Production)

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide to Render.

**Quick Deploy:**
1. Push code to GitHub
2. Create web service on Render
3. Configure environment variables
4. Deploy!

**Live API:** https://grejoy-health-api.onrender.com

## 🔗 Useful Links

- **API Docs:** https://grejoy-health-api.onrender.com/api/docs
- **Health Check:** https://grejoy-health-api.onrender.com/api/health
- **Render Dashboard:** https://dashboard.render.com

## 📝 Environment Variables

Required for production:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `JWT_SECRET_KEY` - Secret for JWT signing
- `PAYSTACK_SECRET_KEY` - Paystack API key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `EMAIL_API_KEY` - Resend/SendGrid API key
- `EMAIL_FROM` - Sender email address
- `FRONTEND_URL` - Frontend URL (for CORS)

See `.env.example` for complete list.

## 🧪 Testing
```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test with HTTPie
http http://localhost:8000/api/products

# View interactive docs
open http://localhost:8000/api/docs
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Products
- `GET /api/products` - List products
- `GET /api/products/{id}` - Product details
- `POST /api/products` - Create (admin)
- `PUT /api/products/{id}` - Update (admin)
- `DELETE /api/products/{id}` - Delete (admin)

### Cart
- `GET /api/cart` - View cart
- `POST /api/cart/items` - Add to cart
- `PUT /api/cart/items/{id}` - Update quantity
- `DELETE /api/cart/items/{id}` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Order details

### Payments
- `POST /api/payments/initialize` - Start payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Paystack webhook

### Admin
- `GET /api/admin/orders` - All orders
- `GET /api/admin/analytics` - Dashboard stats
- `PUT /api/orders/{id}/status` - Update status

## 🛠️ Tech Stack

- **Framework:** FastAPI 0.104+
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT with bcrypt
- **Payments:** Paystack API
- **Email:** Resend API
- **Deployment:** Render

## 📄 License

Proprietary - Grejoy Health Products