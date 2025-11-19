# Grejoy Health Products - Complete Technical Documentation

This document provides an in-depth explanation of how everything works in this project. Perfect for learning and understanding the architecture.

---

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Authentication System](#authentication-system)
4. [Database Design](#database-design)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Payment Integration](#payment-integration)
8. [State Management](#state-management)
9. [API Communication](#api-communication)
10. [Security](#security)
11. [Common Patterns](#common-patterns)
12. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview

### What Is This Project?

This is a **full-stack e-commerce platform** specifically designed for selling health products in Ghana. It includes:

- **Customer portal** for browsing and buying products
- **Admin dashboard** for managing products and orders
- **Payment integration** with Paystack (Mobile Money & Cards)
- **Real-time order tracking**

### Why These Technologies?

#### Backend: FastAPI
- **Fast** - One of the fastest Python frameworks
- **Modern** - Built with Python 3.11+ features
- **Auto-docs** - Automatic API documentation
- **Type-safe** - Uses Pydantic for validation

#### Frontend: React + TypeScript
- **React** - Industry standard, huge ecosystem
- **TypeScript** - Catches bugs before runtime
- **Vite** - Lightning-fast development
- **Component-based** - Reusable UI pieces

#### Database: Supabase (PostgreSQL)
- **PostgreSQL** - Robust, reliable SQL database
- **Real-time** - Built-in real-time subscriptions
- **Auth** - Built-in authentication
- **Free tier** - Great for starting

---

## 2. Architecture

### High-Level Architecture
```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ ◄────► │   Frontend   │ ◄────► │   Backend    │
│  (Client)   │  HTTPS  │  React + TS  │   API   │   FastAPI    │
└─────────────┘         └──────────────┘         └──────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │   Supabase   │
                                                  │  PostgreSQL  │
                                                  └──────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │   Paystack   │
                                                  │   Payment    │
                                                  └──────────────┘
```

### Request Flow Example

Let's trace what happens when a user adds an item to cart:

1. **User clicks "Add to Cart"** button
2. **Frontend** calls `cartService.addToCart(productId, quantity)`
3. **API client** sends POST request to `http://localhost:8000/api/cart/items`
4. **Backend** receives request at `/api/cart/items` endpoint
5. **Authentication middleware** validates JWT token
6. **Route handler** extracts user ID from token
7. **Database query** inserts cart item to Supabase
8. **Response** returns cart item data
9. **React Query** caches the response
10. **UI updates** showing new cart count

---

## 3. Authentication System

### How Authentication Works

#### Step 1: User Signup
```typescript
// Frontend: User fills signup form
const signupData = {
  email: "user@example.com",
  password: "SecurePass123",
  full_name: "John Doe"
};

// Frontend sends to backend
POST /api/auth/signup
```
```python
# Backend: auth.py
@router.post("/signup")
async def signup(user_data: UserCreate):
    # 1. Hash the password
    hashed_password = pwd_context.hash(user_data.password)
    
    # 2. Insert into database
    db.table("users").insert({
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name
    }).execute()
    
    # 3. Create JWT token
    token = create_access_token({"sub": user.id})
    
    # 4. Return token + user data
    return {"access_token": token, "user": user}
```

#### Step 2: Token Storage
```typescript
// Frontend: authStore.ts
setAuth: (user, token) => {
  // Store in localStorage (persists across page refreshes)
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Update Zustand state (for React components)
  set({ user, token, isAuthenticated: true });
}
```

#### Step 3: Using the Token

Every API request includes the token in headers:
```typescript
// Frontend: api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
```python
# Backend: auth.py
async def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    # 1. Decode JWT token
    payload = jwt.decode(token, SECRET_KEY)
    
    # 2. Extract user ID
    user_id = payload.get("sub")
    
    # 3. Fetch user from database
    user = db.table("users").select("*").eq("id", user_id).execute()
    
    # 4. Return user (now available in all protected routes)
    return user.data[0]
```

### JWT Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZXhwIjoxNjc4ODg4ODg4fQ.signature
│                                     │                                        │
│        Header (algorithm)          │         Payload (data)                 │    Signature
```

**Payload contains:**
```json
{
  "sub": "user-id-here",  // Subject (user ID)
  "exp": 1678888888       // Expiration timestamp
}
```

**Why JWT?**
- **Stateless** - No session storage needed on server
- **Secure** - Signed with secret key
- **Self-contained** - Contains all user info
- **Scalable** - Works across multiple servers

---

## 4. Database Design

### Tables Overview
```sql
users
├── id (UUID, primary key)
├── email (unique)
├── password (hashed)
├── full_name
├── phone
├── is_admin (boolean)
└── created_at

products
├── id (UUID, primary key)
├── name
├── description
├── price (numeric)
├── category
├── stock_quantity
├── image_urls (text array)
├── is_active (boolean)
└── created_at

cart_items
├── id (UUID, primary key)
├── user_id (FK → users.id)
├── product_id (FK → products.id)
├── quantity
└── created_at

orders
├── id (UUID, primary key)
├── user_id (FK → users.id)
├── total_amount
├── status (enum: pending, processing, shipped, delivered, cancelled)
├── payment_status (enum: pending, completed, failed)
├── payment_method
├── payment_reference
├── shipping_address (JSON)
└── created_at

order_items
├── id (UUID, primary key)
├── order_id (FK → orders.id)
├── product_id (FK → products.id)
├── quantity
└── price_at_time
```

### Relationships
```
users (1) ──< (many) cart_items
users (1) ──< (many) orders

products (1) ──< (many) cart_items
products (1) ──< (many) order_items

orders (1) ──< (many) order_items
```

### Foreign Keys Explained

**Foreign Key (FK)** = A column that references another table's primary key

Example:
```sql
-- cart_items.user_id references users.id
-- This means: "Each cart item belongs to one user"

cart_items
├── id: "item-123"
├── user_id: "user-456"  ← Points to users table
└── product_id: "prod-789"
```

### Why Separate Order Items?

**Problem:** Product price might change after order

**Solution:** Store price at time of purchase
```sql
order_items
├── product_id: "vitamin-c"
└── price_at_time: 25.00  ← Price when ordered (might be 30.00 now)
```

---

## 5. Frontend Architecture

### Component Hierarchy
```
App.tsx
├── Routes
│   ├── HomePage
│   ├── ProductsPage
│   │   ├── Navbar
│   │   ├── ProductCard (multiple)
│   │   └── ProductDetailModal
│   ├── CartPage
│   │   ├── Navbar
│   │   ├── CartItemCard (multiple)
│   │   └── CartSummary
│   ├── CheckoutPage
│   │   └── Navbar
│   ├── OrdersPage
│   │   ├── Navbar
│   │   └── OrderCard (multiple)
│   └── Admin
│       ├── AdminLayout
│       ├── AdminDashboard
│       ├── AdminProducts
│       └── AdminOrders
```

### State Management (Zustand)

**What is Zustand?**
- Lightweight state management for React
- Simpler than Redux
- Built-in TypeScript support

**Example: Auth Store**
```typescript
// store/authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',  // localStorage key
    }
  )
);
```

**Using the store in components:**
```typescript
// In any component
function MyComponent() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <p>Welcome, {user?.full_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### React Query (TanStack Query)

**What does it do?**
- Fetches data from API
- Caches responses
- Handles loading/error states
- Auto-refetches when needed

**Example:**
```typescript
// Fetching products
const { data: products, isLoading } = useQuery({
  queryKey: ['products'],  // Cache key
  queryFn: () => productService.getProducts(),  // Fetch function
});

// React Query handles:
// 1. Making the API call
// 2. Caching the response
// 3. Providing loading state
// 4. Handling errors
// 5. Auto-refetching when window regains focus
```

**Mutations (for updates):**
```typescript
// Adding to cart
const mutation = useMutation({
  mutationFn: (data) => cartService.addToCart(data),
  onSuccess: () => {
    // Invalidate cache to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    toast.success('Added to cart!');
  },
});

// Use in component
<button onClick={() => mutation.mutate({ productId, quantity })}>
  Add to Cart
</button>
```

### React Router

**Protected Routes:**
```typescript
<Route 
  path="/admin" 
  element={
    <ProtectedRoute adminOnly>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>

// ProtectedRoute.tsx
function ProtectedRoute({ children, adminOnly }) {
  const { isAuthenticated, user } = useAuthStore();

  // Not logged in? → Redirect to login
  if (!isAuthenticated) return <Navigate to="/login" />;

  // Needs admin but user isn't? → Redirect home
  if (adminOnly && !user.is_admin) return <Navigate to="/" />;

  // All good, show the page
  return children;
}
```

---

## 6. Backend Architecture

### FastAPI Application Structure
```python
# main.py - Application entry point
app = FastAPI(
    title="Grejoy Health API",
    version="1.0.0"
)

# Add CORS (Cross-Origin Resource Sharing)
# Allows frontend (localhost:5173) to call backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specific domains only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (like blueprints)
app.include_router(auth.router, prefix="/api/auth")
app.include_router(products.router, prefix="/api/products")
# ... etc
```

### Dependency Injection

**What is it?**
FastAPI automatically provides dependencies to route functions.

**Example:**
```python
# Get database client
def get_db():
    return Database.get_client()

# Get current user (uses JWT token)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Decode token, fetch user
    return user

# Use in route
@router.get("/profile")
async def get_profile(
    db = Depends(get_db),           # ← FastAPI injects database
    current_user = Depends(get_current_user)  # ← FastAPI injects user
):
    # db and current_user are automatically available!
    return current_user
```

### Pydantic Models

**What are they?**
Data validation schemas that ensure correct data types.
```python
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

# If someone sends wrong data type:
# {"email": 123, "password": "pass"}
# Pydantic raises validation error automatically
```

### Route Organization

Each router handles one resource:
```python
# routes/products.py
router = APIRouter()

@router.get("/")  # GET /api/products
async def get_products(): ...

@router.get("/{product_id}")  # GET /api/products/123
async def get_product(product_id: str): ...

@router.post("/")  # POST /api/products
async def create_product(): ...
```

---

## 7. Payment Integration

### Paystack Flow
```
User clicks "Pay Now"
    ↓
Frontend calls: POST /api/payments/initialize/{order_id}
    ↓
Backend creates payment reference
    ↓
Backend calls Paystack API
    ↓
Paystack returns authorization_url
    ↓
Frontend opens Paystack popup (iframe)
    ↓
User enters payment details
    ↓
Paystack processes payment
    ↓
Paystack redirects to: /payment/verify/{reference}
    ↓
Frontend calls: GET /api/payments/verify/{reference}
    ↓
Backend calls Paystack verify API
    ↓
Backend updates order: payment_status = "completed"
    ↓
User sees success page
```

### Payment Initialization
```python
# Backend: payments.py
@router.post("/initialize/{order_id}")
async def initialize_payment(order_id: str):
    # 1. Get order from database
    order = db.table("orders").select("*").eq("id", order_id).execute()
    
    # 2. Create unique reference
    reference = f"ORD-{order_id[:8]}-{uuid.uuid4().hex[:8]}"
    
    # 3. Convert GHS to pesewas (multiply by 100)
    amount_in_pesewas = int(order['total_amount'] * 100)
    
    # 4. Call Paystack API
    response = await httpx.post(
        "https://api.paystack.co/transaction/initialize",
        json={
            "email": user.email,
            "amount": amount_in_pesewas,
            "reference": reference,
            "callback_url": f"{FRONTEND_URL}/payment/verify/{reference}"
        },
        headers={
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"
        }
    )
    
    # 5. Return authorization URL to frontend
    return {
        "authorization_url": response.json()["data"]["authorization_url"],
        "reference": reference
    }
```

### Frontend Paystack Integration
```typescript
// hooks/usePaystack.ts
export const usePaystack = () => {
  const initializePayment = (config) => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    
    script.onload = () => {
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: config.key,
        email: config.email,
        amount: config.amount,
        ref: config.ref,
        callback: (response) => {
          // Payment successful - verify it
          navigate(`/payment/verify/${response.reference}`);
        },
      });

      handler.openIframe();  // Show payment popup
    };

    document.body.appendChild(script);
  };

  return { initializePayment };
};
```

### Payment Verification
```python
# Backend: payments.py
@router.get("/verify/{reference}")
async def verify_payment(reference: str):
    # 1. Call Paystack verify endpoint
    response = await httpx.get(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}
    )
    
    # 2. Check if payment was successful
    transaction = response.json()["data"]
    if transaction["status"] != "success":
        return {"status": "failed"}
    
    # 3. Get order ID from metadata
    order_id = transaction["metadata"]["order_id"]
    
    # 4. Update order in database
    db.table("orders").update({
        "payment_status": "completed",
        "status": "processing"
    }).eq("id", order_id).execute()
    
    # 5. Return success
    return {
        "status": "success",
        "order_id": order_id
    }
```

---

## 8. State Management

### Local State (useState)

Use for component-specific data:
```typescript
function ProductCard() {
  const [quantity, setQuantity] = useState(1);  // Only this component needs it
  
  return (
    <input 
      value={quantity} 
      onChange={(e) => setQuantity(e.target.value)} 
    />
  );
}
```

### Global State (Zustand)

Use for app-wide data (auth, cart count):
```typescript
// store/cartStore.ts
export const useCartStore = create((set) => ({
  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
}));

// Use anywhere
function Navbar() {
  const { cartCount } = useCartStore();
  return <Badge>{cartCount}</Badge>;
}
```

### Server State (React Query)

Use for API data:
```typescript
// Fetching (GET request)
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: productService.getProducts,
});

// Mutating (POST/PUT/DELETE)
const mutation = useMutation({
  mutationFn: cartService.addToCart,
  onSuccess: () => {
    queryClient.invalidateQueries(['cart']);
  },
});
```

---

## 9. API Communication

### Axios Instance
```typescript
// services/api.ts
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Service Layer Pattern
```typescript
// services/productService.ts
export const productService = {
  getProducts: async (filters) => {
    const response = await api.get('/api/products', { params: filters });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  createProduct: async (data) => {
    const response = await api.post('/api/products', data);
    return response.data;
  },
};

// Usage in components
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => productService.getProducts({ category: 'vitamins' }),
});
```

---

## 10. Security

### Password Hashing
```python
# Never store plain passwords!

# Bad ❌
user.password = "mypassword123"

# Good ✅
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash("mypassword123")
# Result: $2b$12$XG7xH3kLy...random_hash
```

**Verifying passwords:**
```python
# User tries to login
provided_password = "mypassword123"
stored_hash = "$2b$12$XG7xH3kLy..."

# Check if password matches hash
is_correct = pwd_context.verify(provided_password, stored_hash)
```

### JWT Security

**Best Practices:**

1. **Short expiration** - Tokens expire after 24 hours
2. **HTTPS only** - Never send tokens over HTTP
3. **httpOnly cookies** - Consider using cookies instead of localStorage
4. **Secret key** - Use strong, random secret (32+ characters)

**Token contents:**
```python
# What goes IN the token (safe):
token_data = {
    "sub": user_id,        # ✅ User ID
    "email": user.email,   # ✅ Email
    "exp": expiration      # ✅ Expiration
}

# What should NOT go in token (unsafe):
# ❌ Passwords
# ❌ Credit card numbers
# ❌ Private keys
# ❌ API secrets
```

### CORS Configuration
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Production: your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**What is CORS?**
- Cross-Origin Resource Sharing
- Browser security feature
- Prevents malicious sites from calling your API
- You must explicitly allow your frontend domain

### SQL Injection Prevention

**Supabase automatically prevents SQL injection:**
```python
# Safe ✅ (using Supabase query builder)
db.table("users").select("*").eq("email", user_input).execute()

# The library sanitizes user_input automatically

# Dangerous ❌ (raw SQL with string interpolation)
query = f"SELECT * FROM users WHERE email = '{user_input}'"
# If user_input = "'; DROP TABLE users; --"
# Your database is gone!
```

---

## 11. Common Patterns

### Custom Hooks

Reusable logic:
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
  });

  return { user, isAuthenticated, login };
};

// Use in any component
function LoginPage() {
  const { login } = useAuth();
  
  const handleSubmit = (data) => {
    login.mutate(data);
  };
}
```

### Error Handling

**Frontend:**
```typescript
const mutation = useMutation({
  mutationFn: orderService.createOrder,
  onSuccess: () => {
    toast.success('Order placed!');
  },
  onError: (error) => {
    const message = error.response?.data?.detail || 'An error occurred';
    toast.error(message);
  },
});
```

**Backend:**
```python
@router.post("/orders")
async def create_order(order_data: OrderCreate):
    try:
        # Create order
        order = db.table("orders").insert(order_data.dict()).execute()
        return order.data[0]
    
    except ValueError as e:
        # Client error (400)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        # Server error (500)
        logger.error(f"Order creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )
```

### Loading States
```typescript
function ProductsPage() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 12. Troubleshooting

### Common Issues

#### 1. "Cannot connect to backend"

**Check:**
```bash
# Is backend running?
curl http://localhost:8000

# Is frontend using correct API URL?
# Check: frontend/.env
VITE_API_URL=http://localhost:8000
```

#### 2. "401 Unauthorized"

**Causes:**
- Token expired (logout and login again)
- Token not sent (check Authorization header)
- Invalid token (check JWT_SECRET_KEY matches)

**Fix:**
```typescript
// Clear localStorage and login again
localStorage.clear();
// Then navigate to /login
```

#### 3. "CORS Error"

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4. "Network Error" when calling API

**Check:**
1. Backend is running: `http://localhost:8000`
2. Frontend .env has correct API URL
3. Firewall not blocking port 8000

#### 5. Paystack Popup Not Showing

**Check:**
1. Paystack public key in `frontend/.env`
2. Browser console for errors
3. Popup blockers disabled

#### 6. Database Connection Failed

**Check:**
```python
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

Visit Supabase dashboard → Settings → API to get credentials

---

## Key Takeaways

### What Makes This Work?

1. **Separation of Concerns**
   - Frontend handles UI
   - Backend handles business logic
   - Database handles data storage

2. **Stateless Authentication**
   - JWT tokens allow scaling
   - No session storage needed
   - Works across multiple servers

3. **Reactive UI**
   - React Query handles data fetching
   - Zustand manages global state
   - Automatic re-renders when data changes

4. **Type Safety**
   - TypeScript catches errors before runtime
   - Pydantic validates API data
   - Fewer bugs in production

5. **Modern Architecture**
   - API-first design
   - Component-based UI
   - Microservices-ready

---

## Learning Resources

### To Learn More:

**FastAPI:**
- Official Docs: https://fastapi.tiangolo.com
- Tutorial: https://fastapi.tiangolo.com/tutorial/

**React:**
- Official Docs: https://react.dev
- React Query: https://tanstack.com/query

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/

**Supabase:**
- Docs: https://supabase.com/docs
- Quickstart: https://supabase.com/docs/guides/getting-started

**Paystack:**
- API Reference: https://paystack.com/docs/api
- Test Cards: https://paystack.com/docs/payments/test-payments

---

Made with ❤️ for learning and understanding!