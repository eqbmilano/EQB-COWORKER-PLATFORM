# ⚡ QUICK DEPLOY REFERENCE - Copy/Paste Ready

**Timing:** 25 minuti  
**Difficulty:** Easy (follow steps)

---

## 🔄 FASE 1: DATABASE (5 min)

### Step 1: Open SQL_SETUP_POSTGRES.sql
Copia TUTTO il contenuto del file [SQL_SETUP_POSTGRES.sql](SQL_SETUP_POSTGRES.sql)

### Step 2: Go to Render Dashboard
https://dashboard.render.com/ → Click eqb-platform-db → SQL Editor

### Step 3: Paste & Run
Incolla il contenuto → Click "Run All" → Wait for success ✅

### Step 4: Verify
Esegui:
```sql
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
```
Dovrebbe ritornare: **24**

---

## 🔧 FASE 2: API RENDER (10 min)

### Step 1: Create Web Service
https://dashboard.render.com/ → New + → Web Service → Connect GitHub

### Step 2: Select Repository
- Repo: `eqbmilano/EQB-COWORKER-PLATFORM`
- Click Connect

### Step 3: Configure
```
Name: eqb-api
Branch: main
Runtime: Node
Root Directory: (blank)
Build Command: npm install && npm run build --workspace=@eqb/api
Start Command: npm --prefix apps/api start
```

### Step 4: Add Environment
Click Environment → Add:
```
DATABASE_URL=postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform
JWT_SECRET=eqb-secret-2026
NODE_ENV=production
API_PORT=10000
```

### Step 5: Deploy
Click "Create Web Service" → Wait 5-10 min → Status = 🟢 Deployed

### Step 6: Get URL
Copy URL from dashboard (es: https://eqb-api-xxx.onrender.com)

---

## 🌐 FASE 3: WEB VERCEL (5 min)

### Step 1: Go to Vercel
https://vercel.com/new

### Step 2: Import Git Repository
- Select: `eqbmilano/EQB-COWORKER-PLATFORM`
- Click Import

### Step 3: Configure
```
Framework: Next.js
Root Directory: apps/web
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 4: Add Environment
Add in Environment Variables:
```
NEXT_PUBLIC_API_URL=https://eqb-api.onrender.com
NODE_ENV=production
```

(Sostituisci con l'URL esatto di Render da FASE 2)

### Step 5: Deploy
Click "Deploy" → Wait 3-5 min → Status = 🟢 Ready

### Step 6: Get URL
Copy URL from dashboard (es: https://eqb-coworker-platform.vercel.app)

---

## ✅ FASE 4: TEST (5 min)

### Test 1: API Health
```powershell
curl -X GET https://eqb-api.onrender.com/api/health
```
Response: Any 2xx/4xx is ok (means API is up)

### Test 2: API Login
```powershell
curl -X POST https://eqb-api.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@eqb.it",
    "password": "AdminEQB2026!"
  }'
```
Response: Should have `"token": "eyJ..."`

### Test 3: Web Load
Open: https://eqb-coworker-platform.vercel.app
Should load login page ✅

### Test 4: Web Login
- Email: admin@eqb.it
- Password: AdminEQB2026!
- Click Sign In
- Should see dashboard ✅

---

## 🎉 DONE!

### Live URLs
```
🌐 Web:  https://eqb-coworker-platform.vercel.app
🔧 API:  https://eqb-api.onrender.com
👤 User: admin@eqb.it / AdminEQB2026!
```

### Total Time
~25 minutes ⏱️

---

## 🐛 IF SOMETHING FAILS

| Error | Fix |
|-------|-----|
| DB Script fails | Check SQL Editor is correct database |
| API won't build | Check Build Command in Step 3 |
| API won't start | Check DATABASE_URL in Environment |
| Web won't build | Check Root Directory = apps/web |
| Web 404 on API | Check NEXT_PUBLIC_API_URL is correct |
| Login 500 error | Check admin user in DB (SELECT * FROM "User" WHERE email='admin@eqb.it') |

---

## 📞 LINKS

- Render: https://dashboard.render.com/
- Vercel: https://vercel.com/dashboard
- GitHub: https://github.com/eqbmilano/EQB-COWORKER-PLATFORM
- Full Guide: [FINAL_SETUP.md](FINAL_SETUP.md)

---

**Start with FASE 1 now!** 🚀
