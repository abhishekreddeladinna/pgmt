# 🚀 PGMT Deployment Guide

## Pre-Deployment Checklist

Before deploying, make sure:
- [x] All console errors fixed
- [x] PWA manifest, service worker, icons in place
- [x] Vite build works (`cd frontend && npm run build`)
- [x] Backend runs with `python3 main.py`
- [x] `.env` is in `.gitignore` (never commit secrets)

### Build the Frontend
```bash
cd frontend
npm install
npm run build    # outputs to frontend/build/
```

### Environment Variables

| Variable | Where | Example |
|----------|-------|---------|
| `DATABASE_URL` | Backend | `postgresql://user:pass@host:5432/pgmt` |
| `PORT` | Backend | `8000` (auto-set by Render/Railway) |
| `ALLOWED_ORIGINS` | Backend | `https://pgmt.vercel.app,https://pgmt.netlify.app` |
| `ENV` | Backend | `production` (hides /docs) |
| `VITE_API_URL` | Frontend (build-time) | `https://pgmt-api.onrender.com` |

---

## 🆓 5 FREE Deployment Options

### 1. Vercel (Frontend) + Render (Backend + DB) ⭐ RECOMMENDED

**Best for:** Zero-config, easiest setup

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Frontend | Vercel | Unlimited deploys, 100GB bandwidth |
| Backend | Render Web Service | 750 hrs/mo, sleeps after 15min idle |
| Database | Render PostgreSQL | Free 90 days, 256MB storage |

**Steps:**

**Backend → Render:**
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your repo, set root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
6. Add environment variables:
   - `DATABASE_URL` → (copy from Render PostgreSQL)
   - `ALLOWED_ORIGINS` → `https://your-app.vercel.app`
   - `ENV` → `production`
7. Create a **PostgreSQL** database on Render → copy the Internal Database URL

**Frontend → Vercel:**
1. Go to [vercel.com](https://vercel.com) → Import Project
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `build`
5. Add environment variable:
   - `VITE_API_URL` → `https://your-backend.onrender.com`
6. Deploy!

---

### 2. Railway (Full Stack)

**Best for:** Single platform, usage-based pricing

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| All-in-one | Railway | $5 free credit/month |

**Steps:**
1. Go to [railway.app](https://railway.app) → New Project
2. Add **PostgreSQL** plugin → copy `DATABASE_URL`
3. Add service from GitHub → set root to `backend`
   - Start: `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
4. Add another service for frontend → root `frontend`
   - Build: `npm run build`, Start: `npx serve build -s -l $PORT`
5. Set env vars on each service

---

### 3. Netlify (Frontend) + Render (Backend + DB)

**Best for:** Great CDN, form handling, similar to Vercel

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Frontend | Netlify | 100GB bandwidth, 300 build min/mo |
| Backend | Render | Same as Option 1 |

**Steps:**
1. Backend on Render (same as Option 1)
2. Go to [netlify.com](https://netlify.com) → Add new site
3. Build command: `cd frontend && npm run build`
4. Publish directory: `frontend/build`
5. Add `_redirects` file in `frontend/public/`:
   ```
   /api/*  https://your-backend.onrender.com/api/:splat  200
   /*      /index.html   200
   ```
6. Set `VITE_API_URL` in Netlify env vars (or leave empty if using `_redirects` proxy)

---

### 4. Fly.io (Full Stack)

**Best for:** Low latency, containers, no cold starts on free tier

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Backend | Fly.io | 3 shared VMs, 256MB RAM each |
| Database | Fly Postgres | 1 free instance, 3GB storage |
| Frontend | Served from backend or Fly static |

**Steps:**
1. Install flyctl: `brew install flyctl`
2. `fly auth login`
3. `fly launch` in the project root
4. Add Dockerfile (see below)
5. `fly postgres create` → attach to your app
6. `fly deploy`

**Dockerfile** (put in project root):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080
```
Deploy frontend separately on Vercel/Netlify, or serve the built files from FastAPI.

---

### 5. GitHub Pages (Frontend) + Render (Backend + DB)

**Best for:** Completely free frontend hosting forever

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Frontend | GitHub Pages | Unlimited, forever free |
| Backend | Render | Same as Option 1 |

**Steps:**
1. `npm run build` in frontend
2. Set `VITE_API_URL=https://your-backend.onrender.com`
3. Push `build/` folder to `gh-pages` branch
4. Enable GitHub Pages in repo settings
5. Add a `404.html` (copy of `index.html`) for SPA routing

> ⚠️ GitHub Pages serves static files only — needs full API URL in frontend.

---

## 💰 5 PAID Deployment Options

### 1. Render Pro — ~$14/month ⭐ EASIEST

| Component | Cost |
|-----------|------|
| Web Service (Starter) | $7/mo |
| PostgreSQL (Starter) | $7/mo |

- **No cold starts** — always running
- Same setup as free tier, just upgrade the plan
- Auto-deploy on git push

---

### 2. DigitalOcean App Platform — ~$20/month

| Component | Cost |
|-----------|------|
| Basic Droplet (Backend) | $5/mo |
| Managed PostgreSQL | $15/mo |
| Static Site (Frontend) | Free |

**Steps:**
1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → App Platform
2. Connect GitHub repo
3. Configure backend service + static frontend
4. Add managed database
5. Deploy

---

### 3. AWS Lightsail — ~$19/month

| Component | Cost |
|-----------|------|
| Lightsail Instance | $3.50/mo |
| Lightsail Managed DB | $15/mo |
| S3 + CloudFront (Frontend) | ~$0.50/mo |

**Steps:**
1. Create Lightsail instance (Ubuntu)
2. SSH in, install Python, clone repo, run with Gunicorn + Nginx
3. Create managed PostgreSQL database
4. Upload `frontend/build/` to S3, add CloudFront distribution

---

### 4. Railway Pro — ~$5-20/month (usage-based)

| Component | Cost |
|-----------|------|
| Compute | $0.000463/min (~$20/mo always-on) |
| PostgreSQL | $0.000231/GB-hr |
| Bandwidth | $0.10/GB |

- Auto-scaling, usage-based billing
- Same setup as free Railway, just add payment method
- Great for apps with variable traffic

---

### 5. Hetzner VPS — €4.51/month 💪 CHEAPEST

| Component | Cost |
|-----------|------|
| CX22 VPS (2 vCPU, 4GB RAM) | €4.51/mo |
| PostgreSQL (self-hosted) | Included |
| Nginx + Certbot (HTTPS) | Included |

**Everything on one server!**

**Steps:**
1. Create CX22 at [hetzner.com](https://hetzner.com)
2. SSH in and set up:
```bash
# Install dependencies
apt update && apt install -y python3-pip postgresql nginx certbot

# Setup PostgreSQL
sudo -u postgres createdb pgmt
sudo -u postgres psql -c "CREATE USER pgmt WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE pgmt TO pgmt;"

# Clone and run backend
git clone https://github.com/you/pgmt.git
cd pgmt/backend
pip install -r requirements.txt
# Use systemd service for production (see below)

# Build and serve frontend
cd ../frontend && npm install && npm run build
cp -r build/* /var/www/html/
```

3. Nginx config (`/etc/nginx/sites-available/pgmt`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. Systemd service (`/etc/systemd/system/pgmt.service`):
```ini
[Unit]
Description=PGMT Backend
After=postgresql.service

[Service]
User=www-data
WorkingDirectory=/root/pgmt/backend
Environment="DATABASE_URL=postgresql://pgmt:yourpassword@localhost/pgmt"
Environment="ENV=production"
ExecStart=/usr/local/bin/gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

5. Enable HTTPS: `certbot --nginx -d yourdomain.com`

---

## 🏆 Recommendation

| Scenario | Best Option | Monthly Cost |
|----------|-------------|-------------|
| **Just trying it out** | Vercel + Render Free | $0 |
| **Small PG (< 50 tenants)** | Render Pro | $14/mo |
| **Budget-conscious + technical** | Hetzner VPS | €4.51/mo |
| **Want managed everything** | DigitalOcean App Platform | $20/mo |
| **Scale later** | Railway Pro | $5-20/mo |
