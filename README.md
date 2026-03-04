# PGMT — PG Management Tool

A PWA for managing PG (paying guest) operations: meals, service requests, and tenant management.

**Status:** ✅ Production Ready | **Stack:** React + FastAPI + PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (free tier available on [Render](https://render.com))

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with DATABASE_URL
pip install -r requirements.txt
python3 main.py          # → http://localhost:8000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:8000
npm install
npm run dev              # → http://localhost:3000
```

### Admin Login (Development)
- **Phone:** `9999999999`
- **Password:** `ADMIN123`

---

## 📖 Deployment

For production deployment to Vercel + Render, see **[PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)**

1. Push to GitHub
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Configure environment variables

---

## 📚 Docs

- [Backend API Docs](http://localhost:8000/docs)
- [Deployment Guide](PRODUCTION_SETUP.md)
- [Production Checklist](PRODUCTION_CHECKLIST.md)
