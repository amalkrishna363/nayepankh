# 🕊️ Nayapankh — Volunteer Information Management System

A full-stack volunteer management system with REST API, admin dashboard, and PostgreSQL database.

## Project Structure

```
Nayapankh/
├── backend/      → Express REST API (port 3001)
├── frontend/     → EJS Admin UI   (port 3000)
└── render.yaml   → One-click Render deployment
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/nayapankh.git
cd nayapankh
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env      # edit DATABASE_URL with your local postgres
node server.js            # runs on http://localhost:3001
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
node server.js            # runs on http://localhost:3000
```

### Default Credentials
- Admin: `admin` / `admin123`
- API Key: `vms_live_demo0000`

---

## Deploy to Render (Permanent Free Hosting)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nayapankh.git
git push -u origin main
```

### Step 2 — Deploy on Render
1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **New** → **Blueprint**
3. Select your `nayapankh` repository
4. Render reads `render.yaml` and creates:
   - ✅ Free PostgreSQL database
   - ✅ Backend service
   - ✅ Frontend service

### Step 3 — Connect Frontend ↔ Backend
After both services are deployed:

1. Copy your **backend URL** (e.g. `https://nayapankh-backend.onrender.com`)
2. Go to **Frontend service** → Environment → Add:
   ```
   API_URL = https://nayapankh-backend.onrender.com
   ```
3. Copy your **frontend URL** (e.g. `https://nayapankh-frontend.onrender.com`)
4. Go to **Backend service** → Environment → Add:
   ```
   FRONTEND_URL = https://nayapankh-frontend.onrender.com
   ```
5. Click **Manual Deploy** on both services

### Your live links
| Link | URL |
|------|-----|
| Volunteer Registration | `https://nayapankh-frontend.onrender.com/` |
| Admin Login | `https://nayapankh-frontend.onrender.com/admin/login` |
| REST API | `https://nayapankh-backend.onrender.com/api/v1/volunteers` |
| GitHub | `https://github.com/YOUR_USERNAME/nayapankh` |

---

## API Reference

All requests need header: `X-Api-Key: vms_live_demo0000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/volunteers` | List all volunteers |
| GET | `/api/v1/volunteers/:id` | Get one volunteer |
| POST | `/api/v1/volunteers` | Create volunteer |
| PATCH | `/api/v1/volunteers/:id` | Update volunteer |
| DELETE | `/api/v1/volunteers/:id` | Delete volunteer |
