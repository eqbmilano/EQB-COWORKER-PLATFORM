# 🚀 DEPLOY RAPIDO - Vercel + Render

**Status:** Pronto per deploy  
**Ultimo Commit:** 692d16c  
**Data:** 27 Gennaio 2026

---

## 📦 DEPLOY WEB SU VERCEL (5 minuti)

### Step 1: Import Repository
1. Vai a https://vercel.com/new
2. Click **Import Git Repository**
3. Seleziona: `eqbmilano/EQB-COWORKER-PLATFORM`
4. Click **Import**

### Step 2: Configura Progetto
```
Framework Preset: Next.js
Root Directory: apps/web
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 3: Environment Variables
Aggiungi in Vercel:
```env
NEXT_PUBLIC_API_URL=https://eqb-api.onrender.com
NODE_ENV=production
```

### Step 4: Deploy
- Click **Deploy**
- Attendi ~2-3 minuti
- URL disponibile: `https://eqb-coworker-platform.vercel.app`

---

## 🔧 DEPLOY API SU RENDER (10 minuti)

### ⚠️ PREREQUISITO: Crea Database PostgreSQL

#### Opzione A: Neon (Consigliato - GRATIS)
1. Vai a https://neon.tech/
2. Sign up con GitHub
3. Create new project: "EQB Platform"
4. Copia **Connection String**:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

#### Opzione B: Render PostgreSQL (Pagamento)
1. In Render Dashboard, click **New +**
2. Seleziona **PostgreSQL**
3. Name: `eqb-database`
4. Copia **Internal Database URL**

---

### Step 1: Import Repository su Render
1. Vai a https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Connect to GitHub → Seleziona `EQB-COWORKER-PLATFORM`
4. Click **Connect**

### Step 2: Configura Service
```
Name: eqb-api
Region: Frankfurt (EU Central)
Branch: main
Root Directory: (lascia vuoto)
Runtime: Node
Build Command: npm install && npm run build --workspace=@eqb/api
Start Command: npm --prefix apps/api start
```

### Step 3: Environment Variables (CRITICO!)
Aggiungi in Render → Environment:

```env
# Database (TUO DATABASE RENDER POSTGRES)
DATABASE_URL=postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform

# Security
JWT_SECRET=super-secret-jwt-key-change-this-to-random-string
NODE_ENV=production

# API Config
API_PORT=10000
```

**✅ DATABASE_URL CONFIGURED!** Pronto per le migrations.

### Step 4: Deploy
- Click **Create Web Service**
- Attendi deploy (~5-10 minuti)
- Render assegna URL: `https://eqb-api.onrender.com`

---

## 🗄️ SETUP DATABASE (CRITICO!)

Dopo deploy API su Render, devi applicare migrations e creare admin:

### Opzione 1: SQL Manuale (Neon Console)

1. Vai a **Neon Console** → SQL Editor
2. Esegui migration completa:

```sql
-- Crea schema completo (copia da apps/api/prisma/migrations/20260126162150_init/migration.sql)
-- Poi crea admin user:

INSERT INTO "User" (
  id, email, password, "firstName", "lastName", 
  role, status, "createdAt", "updatedAt"
) VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@eqb.it',
  '$2b$10$KIXSvZWpN.yI9qE5yLZ0eOQR5Z6vF0K7mH.LkXQZ8xN1qE5yLZ0eO',
  'Admin',
  'EQB',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);
```

**Nota:** La password hashata sopra corrisponde a `AdminEQB2026!`

### Opzione 2: Migration Script

Puoi creare uno script di migrazione sul repository e triggere un redeploy.

---

## ✅ VERIFICA DEPLOY

### Test API
```bash
# Health check
curl https://eqb-api.onrender.com/api/health

# Login test
curl -X POST https://eqb-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eqb.it",
    "password": "AdminEQB2026!"
  }'
```

### Test Web
1. Vai a `https://eqb-coworker-platform.vercel.app`
2. Click **Login**
3. Email: `admin@eqb.it`
4. Password: `AdminEQB2026!`
5. Dovrebbe fare login ✓

---

## 🔗 URL FINALI

Una volta completato:

```
🌐 Web App:  https://eqb-coworker-platform.vercel.app
🔧 API:      https://eqb-api.onrender.com
🗄️ Database: Neon PostgreSQL (Neon Console)
```

---

## 🐛 TROUBLESHOOTING

### API restituisce 500
- ✅ Verifica DATABASE_URL in Render Environment
- ✅ Verifica database accessibile (test connection in Neon)
- ✅ Verifica migrations applicate
- ✅ Verifica admin user creato

### Web App non si connette all'API
- ✅ Verifica NEXT_PUBLIC_API_URL in Vercel
- ✅ Verifica CORS configurato nell'API
- ✅ Verifica API URL corretto (https://eqb-api.onrender.com)

### Login fallisce
- ✅ Verifica admin user esiste nel database
- ✅ Verifica JWT_SECRET configurato
- ✅ Test API login endpoint direttamente con curl

---

## 📊 CHECKLIST COMPLETA

### Pre-Deploy
- [x] Codice pushato su GitHub (commit 692d16c)
- [x] Build locale funziona (`npm run build`)
- [ ] Database PostgreSQL creato (Neon)
- [ ] Connection string copiato

### Vercel Deploy
- [ ] Repository importato
- [ ] Root directory: `apps/web`
- [ ] Environment variables configurate
- [ ] Deploy completato
- [ ] URL funzionante

### Render Deploy
- [ ] Repository importato
- [ ] Build/Start commands configurati
- [ ] Environment variables configurate (DATABASE_URL!)
- [ ] Deploy completato
- [ ] Health check funziona

### Database Setup
- [ ] Migrations applicate (SQL in Neon)
- [ ] Admin user creato
- [ ] Login test funziona

### Final Test
- [ ] Web app carica
- [ ] Login funziona
- [ ] Dashboard accessibile
- [ ] API risponde

---

## 🎯 TEMPO STIMATO

- Neon setup: **3 minuti**
- Vercel deploy: **5 minuti**
- Render deploy: **10 minuti**
- Database migrations: **5 minuti**
- Testing: **5 minuti**

**TOTALE: ~30 minuti** ⏱️

---

## 💡 TIPS

1. **Neon è gratuito** e perfetto per MVP/testing
2. **Render free tier** ha cold start (~30s), considera upgrade per production
3. **Vercel** ha SSL automatico e CDN globale
4. **Salva i connection string** in un password manager
5. **Monitora logs** su Render per errori

---

## 📞 SUPPORT

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Troubleshooting**: Vedi RENDER_TROUBLESHOOTING.md

---

## 📂 DOCUMENTI CORRELATI

- **[FINAL_SETUP.md](FINAL_SETUP.md)** ← Guida step-by-step completa
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** ← Checklist interattiva
- **[SQL_SETUP_POSTGRES.sql](SQL_SETUP_POSTGRES.sql)** ← Script SQL pronto da incollare

---

**Ready to deploy!** 🚀  
Usa [FINAL_SETUP.md](FINAL_SETUP.md) per una guida passo-passo. Stima: 25 minuti totali.
