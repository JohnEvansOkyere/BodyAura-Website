# ⚡ Quick Fixes Checklist

Priority issues you can fix right now (sorted by impact/time ratio):

---

## 🚨 CRITICAL (Do First - 30 minutes total)

### 1. Fix Duplicate Import (2 minutes)
**File:** `backend/app/main.py:6`

```python
# BEFORE:
from app.routes import auth, products, cart, orders, admin, payments, admin

# AFTER:
from app.routes import auth, products, cart, orders, admin, payments
```

### 2. Create Backend .env.example (5 minutes)
**File:** `backend/.env.example` (NEW)

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here

# JWT (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Email (optional)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@yoursite.com

# App
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### 3. Fix Duplicate in requirements.txt (1 minute)
**File:** `backend/requirements.txt:20`

Remove duplicate line:
```bash
# Remove line 20: passlib[bcrypt]==1.7.4
```

### 4. Remove Console.log Statements (5 minutes)

**File:** `frontend/src/components/ProductDetailsModal.tsx:24`
```typescript
// Remove or wrap:
if (import.meta.env.DEV) {
  console.log('ProductDetailsModal rendered with product:', product.name);
}
```

**File:** `frontend/src/components/ProductCard.tsx:21`
```typescript
// Remove or wrap:
if (import.meta.env.DEV) {
  console.log('ProductCard clicked:', product.name);
}
```

---

## 🔥 HIGH PRIORITY (Do Today - 2 hours total)

### 5. Add Rate Limiting (30 minutes)

**Install:**
```bash
cd backend
pip install slowapi
pip freeze > requirements.txt
```

**File:** `backend/app/main.py` (add after imports)
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# After app = FastAPI(...), before CORS:
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**File:** `backend/app/routes/auth.py` (add decorator to login & signup)
```python
from fastapi import APIRouter, Request  # Add Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(
    request: Request,  # Add this
    credentials: UserLogin,
    db: Client = Depends(get_db)
):
    ...

@router.post("/signup")
@limiter.limit("3/minute")  # 3 signups per minute
async def signup(
    request: Request,  # Add this
    user_data: UserCreate,
    db: Client = Depends(get_db)
):
    ...
```

### 6. Add Basic Request Logging (20 minutes)

**File:** `backend/app/middleware/logging_middleware.py` (NEW)
```python
import time
import logging
from fastapi import Request

logger = logging.getLogger(__name__)

async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(
        f"→ {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )
    
    try:
        response = await call_next(request)
        
        # Log response
        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"← {request.method} {request.url.path} "
            f"[{response.status_code}] {process_time:.0f}ms"
        )
        
        return response
    except Exception as e:
        logger.error(f"✖ {request.method} {request.url.path} failed: {str(e)}")
        raise
```

**File:** `backend/app/main.py` (add after app creation)
```python
from app.middleware.logging_middleware import log_requests

# After app = FastAPI(...):
app.middleware("http")(log_requests)
```

### 7. Move CORS Origins to Env (20 minutes)

**File:** `backend/app/config.py` (add to Settings class)
```python
# Add after FRONTEND_URL:
CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

class Config:
    env_file = ".env"
    case_sensitive = True
    extra = "ignore"
    
    @validator('CORS_ORIGINS', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
```

**File:** `backend/app/main.py` (update CORS)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**File:** `backend/.env.example` (add)
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-prod-domain.com
```

### 8. Add Input Sanitization (30 minutes)

**Install:**
```bash
pip install bleach
pip freeze > requirements.txt
```

**File:** `backend/app/utils/sanitize.py` (NEW)
```python
import bleach

ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'br']
ALLOWED_ATTRIBUTES = {}

def sanitize_html(text: str | None) -> str | None:
    """Remove potentially dangerous HTML"""
    if not text:
        return text
    return bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)

def sanitize_text(text: str | None, max_length: int = 5000) -> str | None:
    """Basic text sanitization"""
    if not text:
        return text
    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    # Limit length
    return text[:max_length]
```

**File:** `backend/app/services/product_service.py` (add to create/update)
```python
from app.utils.sanitize import sanitize_html, sanitize_text

@staticmethod
async def create_product(db: Client, product_data: ProductCreate) -> ProductResponse:
    # Add before creating product:
    product_data.name = sanitize_text(product_data.name, 200)
    product_data.description = sanitize_html(product_data.description)
    ...
```

---

## ⚠️ MEDIUM PRIORITY (Do This Week - 4 hours total)

### 9. Upgrade JWT Library (30 minutes)

**Backup current code first!**

```bash
cd backend

# Remove old library
pip uninstall python-jose

# Install new library
pip install PyJWT[crypto]==2.8.0
pip freeze > requirements.txt
```

**File:** `backend/app/utils/auth.py`
```python
# BEFORE:
from jose import JWTError, jwt

# AFTER:
import jwt
from jwt.exceptions import JWTError
```

**Test thoroughly after this change!**

### 10. Improve Health Check (15 minutes)

**File:** `backend/app/main.py`
```python
@app.get("/api/health")
async def health_check(db: Client = Depends(get_db)):
    """Enhanced health check with DB verification"""
    try:
        # Test database connection
        result = db.table("users").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "database": "disconnected"}
        )
```

### 11. Set Up Sentry (30 minutes)

**Install:**
```bash
# Backend
cd backend
pip install sentry-sdk[fastapi]
pip freeze > requirements.txt

# Frontend
cd frontend
npm install @sentry/react
```

**File:** `backend/app/config.py` (add)
```python
SENTRY_DSN: str | None = None
```

**File:** `backend/app/main.py` (add at top, before app creation)
```python
import sentry_sdk

if settings.SENTRY_DSN and settings.ENVIRONMENT == "production":
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
    )
```

**File:** `frontend/src/main.tsx` (add at top)
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
```

---

## ✅ TESTING (Nice to Have - 6 hours)

### 12. Add Basic Tests (6 hours)

**Backend:**
```bash
cd backend
pip install pytest pytest-asyncio httpx
mkdir tests
```

**File:** `backend/tests/test_auth.py` (NEW)
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_signup_success():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "password": "Test123!",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 201
        assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
```

**Frontend:**
```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**File:** `frontend/vite.config.ts` (add test config)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  // ... rest of config
});
```

---

## 📋 COMPLETION CHECKLIST

Mark as done:

- [ ] Fixed duplicate import
- [ ] Created .env.example
- [ ] Fixed requirements.txt duplicate
- [ ] Removed/wrapped console.log
- [ ] Added rate limiting
- [ ] Added request logging
- [ ] Moved CORS to env vars
- [ ] Added input sanitization
- [ ] Upgraded JWT library
- [ ] Improved health check
- [ ] Set up Sentry
- [ ] Added basic tests

---

## 🎯 VERIFICATION

After completing fixes, verify:

```bash
# Backend
cd backend
python -m pytest
python -c "from app.main import app; print('✓ App loads successfully')"

# Frontend
cd frontend
npm run build
npm run lint
```

---

## 📞 NEED HELP?

See full audit report: `CODEBASE_AUDIT_REPORT.md`

---

**Total Time to Complete All Quick Fixes:** ~10 hours  
**Critical Fixes Only:** ~30 minutes  
**High Priority:** ~2 hours
