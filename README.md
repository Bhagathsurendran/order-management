Order Management

A production-quality, full-stack order management system with real-time WebSocket updates, JWT authentication, currency conversion, and a modern admin dashboard.

---

## Features

- **JWT Authentication** — Access + refresh tokens with rotation and Redis-backed blacklisting
- **Real-Time Updates** — WebSocket broadcasts every order status change instantly
- **Currency Conversion** — Converts INR to USD via ExchangeRate API with fallback
- **Role-Based Access** — Admin / User roles with protected routes
- **Redis Cache** — Order lists and stats cached, invalidated on mutations
- **Audit Logs** — Every order change recorded with before/after state
- **Soft Delete** — Orders are never hard-deleted; preserved for audit
- **Pagination, Search, Sort, Filter** — Full order list controls
- **Dashboard Charts** — Status pie chart + revenue bar chart (Recharts)
- **Dark Mode** — Beautiful dark admin UI with Tailwind CSS + ShadCN

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (python-jose), Passlib (bcrypt) |
| Frontend | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, ShadCN UI, Lucide Icons |
| State | Zustand, TanStack Query |
| Charts | Recharts |
| DevOps | Docker, Docker Compose |

---

## Seeded Credentials

| Username | Password | Role |
| `admin` | `Admin@123` | Admin |


---

## Quick Start (Docker — Recommended)

### 1. Clone and configure

```bash
git clone <repo-url>
cd order-dashboard
```

### 2. Set up environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — add your EXCHANGE_RATE_API_KEY (optional)

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Launch all services

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **Backend API** on port `8000`
- **Frontend** on port `3000`

The backend automatically runs `alembic upgrade head` (migrations + seed data) on startup.

### 4. Open the app

| URL | Description |
|---|---|
| http://localhost:3000 | Frontend Dashboard |
| http://localhost:8000/docs | FastAPI Swagger UI |
| http://localhost:8000/redoc | ReDoc API Docs |
| http://localhost:8000/health | Health Check |

---

## Run Locally (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
.\venv\Scripts\Activate.ps1     # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and settings

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start dev server
npm run dev
```

---

## Folder Structure

```
order-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/router.py      # Auth endpoints
│   │   │   └── orders/router.py    # Order CRUD + WebSocket
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   ├── security.py         # JWT + bcrypt
│   │   │   ├── dependencies.py     # Dependency injection
│   │   │   └── logging_config.py   # Logging setup
│   │   ├── database/database.py    # Async SQLAlchemy engine
│   │   ├── models/                 # ORM models (User, Order, AuditLog)
│   │   ├── schemas/                # Pydantic V2 schemas
│   │   ├── services/               # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── order_service.py
│   │   │   ├── currency_service.py
│   │   │   ├── audit_service.py
│   │   │   └── cache_service.py
│   │   ├── middleware/             # Logging + rate limiting
│   │   ├── websocket/manager.py    # WebSocket connection manager
│   │   ├── utils/response.py       # Standardized responses
│   │   └── main.py                 # App factory
│   ├── alembic/                    # Database migrations
│   ├── tests/                      # pytest tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/                        # Next.js App Router pages
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── orders/[id]/page.tsx
│   ├── components/                 # Reusable UI components
│   ├── api/                        # API call modules
│   ├── hooks/                      # React Query + WebSocket hooks
│   ├── store/                      # Zustand state stores
│   ├── types/index.ts              # TypeScript type definitions
│   ├── lib/                        # Utilities (axios, queryClient, utils)
│   ├── middleware.ts               # Route protection
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login (returns access + refresh tokens) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/auth/me` | Get current user |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/orders` | Create order (with USD conversion) |
| GET | `/api/v1/orders` | List orders (paginate, search, filter, sort) |
| GET | `/api/v1/orders/stats` | Dashboard statistics |
| GET | `/api/v1/orders/{id}` | Get order detail |
| PATCH | `/api/v1/orders/{id}/status` | Update status (broadcasts via WS) |
| DELETE | `/api/v1/orders/{id}` | Soft delete (admin only) |
| WS | `/ws/orders` | Real-time order updates |

### Response Format
```json
// Success
{ "success": true, "message": "...", "data": {} }

// Error
{ "success": false, "message": "...", "errors": [] }
```

---

## Architecture

```
Browser ←WebSocket→ FastAPI ←→ PostgreSQL
   ↕                   ↕
React Query         Redis Cache
   ↕                   ↕
Zustand           ExchangeRate API
```

**Key Design Decisions:**
1. **Async FastAPI** — fully async for WebSocket + concurrent API calls
2. **Redis cache** — order lists cached with 60s TTL, invalidated on mutation
3. **Soft delete** — orders never hard-deleted; safe for audit compliance
4. **Token rotation** — refresh tokens are single-use (Redis blacklisted)
5. **WebSocket singleton** — `ConnectionManager` broadcasts to all active WS clients

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/orderdb
SECRET_KEY=your-32-char-min-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
EXCHANGE_RATE_API_KEY=your_key_here   # optional, uses fallback if missing
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx aiosqlite anyio
pytest tests/ -v
```

---

## Docker Commands

```bash
# Start all services
docker-compose up --build

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Run migrations manually
docker-compose exec backend alembic upgrade head
```
