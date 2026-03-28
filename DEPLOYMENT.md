# 🚀 Chore Planner - Deployment Guide

## 1. Local Docker Test

```bash
cd backend
docker build -t choreplanner .
docker run -p 8080:8080 choreplanner
```

Visit `http://localhost:8080/login.html`

## 2. Render.com Deploy (Recommended - Free Tier)

### Pre-requisites
- GitHub account
- Render account (free signup)

### Steps
1. **Push to GitHub**:
```bash
git add .
git commit -m \"Deploy ready - fix WebSocket + prod config\"
git push origin main
```

2. **Render Dashboard**:
 - New → Web Service → Docker
 - Connect GitHub repo
 - **Auto-deploy branch**: main

3. **Environment Variables**:
```
DATABASE_URL=mysql://host:port/db?user=... (Render DB service)
APP_OWNER_EMAIL=your-email@example.com
APP_OWNER_PASSWORD=your-secure-password
```

4. **Deploy** → Live URL in 5 mins!

## 3. Railway.app (Alternative)
```
railway login
railway init
railway up
```

## 4. VPS (DigitalOcean/AWS)
```bash
# Build & run
cd backend
docker build -t choreplanner .
docker run -d -p 80:8080 --name choreplanner -e DATABASE_URL=... choreplanner
```

## Prod Config (application.properties)
```
spring.profiles.active=prod
spring.jpa.hibernate.ddl-auto=update
spring.datasource.url=${DATABASE_URL}
server.port=${PORT}
spring.h2.console.enabled=false
```

## Database Setup
**Render**: Create PostgreSQL/MySQL service → copy `DATABASE_URL`

**Local**: Use MySQL Docker:
```bash
docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=choreplanner mysql:8
```

**Live URL**: `https://your-app.onrender.com/login.html`

✅ **Ready to deploy!**

