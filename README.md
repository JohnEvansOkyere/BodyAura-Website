# BodyAura-Website


A full-stack e-commerce platform for health products in Ghana with Mobile Money payment integration via Paystack.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## Features

### Customer Features
- User authentication (Sign up, Login, JWT tokens)
- Product catalog with search and filters
- Shopping cart management
- Order placement and tracking
- Secure payments (Mobile Money & Card via Paystack)
- Responsive design for mobile and desktop

### Admin Features
- Dashboard with sales statistics
- Product management (Create, Edit, Delete)
- Order management (View, Update status)
- Revenue tracking
- Low stock alerts

---

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database & authentication
- **Paystack** - Payment processing
- **JWT** - Secure authentication tokens
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

---

## Prerequisites

Before you begin, ensure you have:

- **Python 3.11+** installed
- **Node.js 18+** and npm installed
- **Supabase account** (free tier works)
- **Paystack account** (for payments)
- **Git** installed

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/JohnEvansOkyere/BodyAura-Website.git
cd grejoy-health
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Backend Environment Variables** (`.env`):
```bash
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# JWT Secret (generate with: openssl rand -hex 32)
# JWT_SECRET_KEY=your_secret_key_here
# JWT_ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Environment
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

1. Create Supabase project at https://supabase.com
2. Run the SQL schema:
```bash
# Copy SQL from backend/database_schema.sql
# Paste into Supabase SQL Editor and run
```

3. Create admin user:
```sql
INSERT INTO users (email, password, full_name, is_admin)
VALUES (
  'admin@grejoy.com',
  '$2b$12$hashed_password_here',
  'Admin User',
  true
);
```

### 4. Frontend Setup
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Frontend Environment Variables** (`.env`):
```bash
VITE_API_URL=http://localhost:8000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
```

---

## Running the Application

### Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```


### Start Frontend Development Server
```bash
cd frontend
npm run dev
```


---


### Test Payment Cards
Use these Paystack test cards:

- **Card Number:** 4084084084084081
- **CVV:** 408
- **Expiry:** Any future date
- **PIN:** 0000
- **OTP:** 123456

---

## Project Structure
```
grejoy-health/
├── backend/
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── cart.py
│   │   │   ├── orders.py
│   │   │   ├── payments.py
│   │   │   └── admin.py
│   │   ├── main.py         # FastAPI app
│   │   ├── config.py       # Configuration
│   │   └── database.py     # Supabase client
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{id}` - Update item quantity
- `DELETE /api/cart/items/{id}` - Remove item

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders` - Create order

### Payments
- `POST /api/payments/initialize/{order_id}` - Initialize payment
- `GET /api/payments/verify/{reference}` - Verify payment

### Admin
- `GET /api/admin/dashboard` - Get statistics
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/{id}` - Update order status


---

## Deployment

**Your app is now deployment-ready!**

### Quick Start (15 minutes)

**Start here:** [DEPLOYMENT_QUICK_START.md](docs/DEPLOYMENT_QUICK_START.md)

```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy backend (Render) - via dashboard
# 3. Deploy frontend (Vercel) - via dashboard
# 4. Done!
```

### Complete Guides

- **Complete Guide:** [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
  - Detailed step-by-step instructions
  - Troubleshooting tips
  - Production best practices

- **Environment Variables:** [ENV_VARIABLES_GUIDE.md](docs/ENV_VARIABLES_GUIDE.md)
  - All required variables
  - Where to get credentials
  - Security best practices

- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
  - Step-by-step checklist
  - Verify everything works
  - Post-deployment tasks

### Already Configured

- `backend/render.yaml` - Backend configuration
- `frontend/vercel.json` - Frontend configuration
- Mobile responsive design
- Production-ready code

**Deploy with confidence!**

---

## Mobile Responsive

**Fully optimized for all devices!**

- **Quick Summary:** [MOBILE_SUMMARY.md](docs/MOBILE_SUMMARY.md)
- **Testing Guide:** [MOBILE_TESTING_GUIDE.md](docs/MOBILE_TESTING_GUIDE.md)
- **Visual Reference:** [MOBILE_VISUAL_GUIDE.md](docs/MOBILE_VISUAL_GUIDE.md)
- **Complete Details:** [MOBILE_RESPONSIVE_COMPLETE.md](docs/MOBILE_RESPONSIVE_COMPLETE.md)

**Supported devices:**
- Phones (320px - 767px)
- Tablets (768px - 1023px)
- Desktops (1024px+)

**Features:**
- Touch-friendly (44px+ tap targets)
- iOS & Android optimized
- Responsive grids & layouts
- Mobile navigation drawer
- Full-screen modals on mobile

---

## Testing

### Test Deployment Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Open: http://localhost:8000/api/docs
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Open: http://localhost:5173
```

### Test Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
# Test at: http://localhost:4173
```

### Mobile Testing

```bash
# Use Chrome DevTools
# Press F12 → Device Mode (Ctrl+Shift+M)
# Test on: iPhone SE, iPad, Pixel 5
```

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Developer

**Evans** - AI/ML Specialist & Full-Stack Developer
- Company: VexaAI
- Location: Ghana

---

## Acknowledgments

- **FastAPI** - Amazing Python framework
- **Supabase** - Backend as a service
- **Paystack** - Payment processing for Africa
- **Vercel** - Frontend hosting
- **Render** - Backend hosting

---

## Support

For support, email support@okyerevansjohn.com or create an issue in the repository.

---

## Roadmap

- [ ] Email notifications
- [ ] SMS order updates
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)

---

Made with love in Ghana