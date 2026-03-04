# 🚀 Quick Start & Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (or use free cloud database like Render)

### Backend Setup
```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env and add your DATABASE_URL
# For local development, you can get a free PostgreSQL from Render

# Install dependencies
pip install -r requirements.txt

# Start server
python3 main.py
# Server runs at http://localhost:8000
```

### Frontend Setup
```bash
cd frontend

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your backend URL
# For local: VITE_API_URL=http://localhost:8000

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend runs at http://localhost:3000 (or next available port)
```

**Admin Login (Dev):**
- Phone: `9999999999`
- Password: `ADMIN123`

---

## 🌐 Production Deployment (Vercel + Render)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pgmt.git
git push -u origin main
```

### Step 2: Backend (Render)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repository
3. **Settings:**
   - Name: `pgmt-api`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

4. **Environment Variables:**
   - `DATABASE_URL`: Create a Postgres database on Render, copy the Internal Database URL
   - `ENV`: `production`
   - `ALLOWED_ORIGINS`: `https://your-domain.vercel.app`
   - `PORT`: `8000`

5. Deploy!

### Step 3: Database (Render)
1. In Render dashboard → New PostgreSQL
2. Copy the **Internal Database URL** to backend's `DATABASE_URL`

### Step 4: Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repo
3. **Settings:**
   - Framework: Other
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Environment Variables:**
   - `VITE_API_URL`: `https://your-backend-name.onrender.com`

5. Deploy!

---

## Troubleshooting

**Frontend can't reach backend (CORS error)**
- Update `ALLOWED_ORIGINS` in backend `.env` with your Vercel domain

**PostgreSQL connection fails**
- Ensure `DATABASE_URL` is correct in backend `.env`
- Make sure the database credentials are URL-encoded

**Admin account missing**
- The admin user is only created in development mode
- For production, create admin users through the app or database directly

---

## File Structure
```
pgmt/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Local secrets (git ignored)
│   └── .env.example          # Template for .env
├── frontend/
│   ├── src/                  # React components
│   ├── package.json          # NPM dependencies
│   ├── vite.config.ts        # Build config
│   ├── .env.local            # Local dev config (git ignored)
│   └── .env.example          # Template for environment
└── .gitignore                # Git ignore rules
```

---

## API Documentation
Once deployed, API docs are available at:
- **Development:** `http://localhost:8000/docs`
- **Production:** `https://your-backend.onrender.com/docs` (if ENV != production)

---

## Support Platforms
- ✅ Vercel (Frontend)
- ✅ Render (Backend + Database)
- ✅ Railway (Alternative full-stack)
- ✅ Netlify (Alternative frontend)
