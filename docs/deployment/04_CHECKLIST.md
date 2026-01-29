# ✅ DEPLOYMENT CHECKLIST - EQB COWORKER PLATFORM

**Data Inizio:** 29 Gennaio 2026  
**Status Generale:** 🟡 IN PROGRESS  
**Ultimo Update:** 2026-01-29

---

## 📋 FASE 1: DATABASE SETUP (Tempo: ~5 minuti)

### 1.1 Copia Script SQL
- [ ] Apri file [SQL_SETUP_POSTGRES.sql](SQL_SETUP_POSTGRES.sql)
- [ ] Copia TUTTO il contenuto (Ctrl+A, Ctrl+C)

### 1.2 Connetti a Render Database
- [ ] Vai a https://dashboard.render.com/
- [ ] Apri servizio **eqb-platform-db** (PostgreSQL)
- [ ] Clicca **SQL Editor**
- [ ] Ricevi connection string se richiesto

### 1.3 Esegui Script
- [ ] Incolla script nel SQL Editor
- [ ] Click **Run All**
- [ ] Attendi completamento (Dovrebbe dire ✅ Success)

### 1.4 Verifica Database
Esegui in SQL Editor:
```sql
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT email, role FROM "User" WHERE email = 'admin@eqb.it';
```

- [ ] Query 1 ritorna: **24 tables**
- [ ] Query 2 ritorna: **admin@eqb.it | ADMIN**

**FASE 1 COMPLETATA?** ✅ → Procedi a FASE 2

---

## 🔧 FASE 2: API DEPLOYMENT SU RENDER (Tempo: ~10 minuti)

### 2.1 Crea Web Service
- [ ] Vai a https://dashboard.render.com/
- [ ] Click **New +** → **Web Service**
- [ ] Click **Connect to GitHub**
- [ ] Seleziona **eqbmilano/EQB-COWORKER-PLATFORM**
- [ ] Click **Connect**

### 2.2 Configura Service
- [ ] Name: `eqb-api`
- [ ] Branch: `main`
- [ ] Runtime: `Node`
- [ ] Root Directory: (lascia vuoto)
- [ ] Build Command: `npm install && npm run build --workspace=@eqb/api`
- [ ] Start Command: `npm --prefix apps/api start`

### 2.3 Aggiungi Environment Variables
Clicca **Environment** e aggiungi (una per riga):

```
DATABASE_URL=postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform
JWT_SECRET=eqb-jwt-secret-2026-super-secure-key-change-in-prod
NODE_ENV=production
API_PORT=10000
```

- [ ] DATABASE_URL configurato
- [ ] JWT_SECRET configurato
- [ ] NODE_ENV = production
- [ ] API_PORT = 10000

### 2.4 Deploy
- [ ] Click **Create Web Service**
- [ ] Attendi build (5-10 minuti)
- [ ] Quando status diventa 🟢 **Deployed**, è pronto!

### 2.5 Ottieni URL API
- [ ] Apri dashboard Render
- [ ] Vai su **eqb-api** service
- [ ] Copia URL (sarà qualcosa come `https://eqb-api-xxxx.onrender.com`)
- [ ] Salva URL per FASE 3

**FASE 2 COMPLETATA?** ✅ → Procedi a FASE 3

---

## 🌐 FASE 3: WEB DEPLOYMENT SU VERCEL (Tempo: ~5 minuti)

### 3.1 Vai su Vercel
- [ ] Accedi a https://vercel.com/
- [ ] Click **Add New...** → **Project**
- [ ] Click **Import Git Repository**
- [ ] Seleziona **eqbmilano/EQB-COWORKER-PLATFORM**
- [ ] Click **Import**

### 3.2 Configura Build Settings
- [ ] Framework Preset: `Next.js`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`
- [ ] Root Directory: `apps/web`

### 3.3 Aggiungi Environment Variables
Nella sezione **Environment Variables**, aggiungi:

```
NEXT_PUBLIC_API_URL=https://eqb-api.onrender.com
NODE_ENV=production
```

(Sostituisci con l'URL esatto di Render se diverso)

- [ ] NEXT_PUBLIC_API_URL configurato
- [ ] NODE_ENV = production

### 3.4 Deploy
- [ ] Click **Deploy**
- [ ] Attendi deploy (~3-5 minuti)
- [ ] Quando diventa 🟢 **Ready**, è live!

### 3.5 Ottieni URL Web
- [ ] Apri dashboard Vercel
- [ ] Copia URL (sarà qualcosa come `https://eqb-coworker-platform.vercel.app`)
- [ ] Salva URL

**FASE 3 COMPLETATA?** ✅ → Procedi a FASE 4

---

## ✅ FASE 4: TESTING FINALE (Tempo: ~5 minuti)

### 4.1 Test API Health Check
Apri PowerShell e esegui:
```powershell
curl -X GET https://eqb-api.onrender.com/api/health
```

- [ ] Ricevi risposta (anche se è errore, significa API è online)
- [ ] Status code non è 502/503 (cold start?)

### 4.2 Test API Login
```powershell
$response = curl -X POST https://eqb-api.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@eqb.it",
    "password": "AdminEQB2026!"
  }'

Write-Host $response
```

- [ ] Ricevi risposta con **token JWT**
- [ ] Non ricevi 401/500 error

### 4.3 Test Web App - Load
- [ ] Vai a `https://eqb-coworker-platform.vercel.app`
- [ ] Pagina carica (non 502/503)
- [ ] Vedi login form

### 4.4 Test Web App - Login
- [ ] Clicca **Login**
- [ ] Email: `admin@eqb.it`
- [ ] Password: `AdminEQB2026!`
- [ ] Click **Sign In**

- [ ] Login ha successo
- [ ] Sei reindirizzato a dashboard
- [ ] Vedi dati (anche se vuoti per adesso)

### 4.5 Test Web App - Navigation
- [ ] Clicca su sezioni (Appointments, Operators, ecc.)
- [ ] Non ricevi 500 errors
- [ ] Pages caricano correttamente

**FASE 4 COMPLETATA?** ✅ **DEPLOYMENT FINITO!**

---

## 🎉 DEPLOYMENT COMPLETATO!

### 📊 Summary
```
✅ Database:  PostgreSQL su Render (24 tables, admin creato)
✅ API:       Express.js su Render (https://eqb-api.onrender.com)
✅ Web:       Next.js su Vercel (https://eqb-coworker-platform.vercel.app)
✅ Testing:   Tutti i test passano
```

### 🔗 URL Live

| Componente | URL |
|-----------|-----|
| **Web App** | https://eqb-coworker-platform.vercel.app |
| **API** | https://eqb-api.onrender.com |
| **Admin** | admin@eqb.it / AdminEQB2026! |
| **GitHub** | https://github.com/eqbmilano/EQB-COWORKER-PLATFORM |

---

## ⚠️ NOTE IMPORTANTI

### Cold Start su Render
La prima richiesta all'API potrebbe impiegare 30-60 secondi (cold start free tier).
Dopo è veloce. Considera upgrade per production.

### Monitoraggio Logs
- **Render Logs:** Dashboard → eqb-api → Logs
- **Vercel Logs:** Dashboard → Project → Deployments → Logs

### Prossimi Step (Consigliati)
1. Aggiungi dati test (coworkers, clients, appointments)
2. Testa flow completo (prenotazioni, fatturazione, ecc.)
3. Configura dominio custom
4. Setup monitoring/alerting
5. Prepare per scalamento (paid tiers)

---

## 🆘 PROBLEMI?

### API restituisce 500
```
1. Controlla Render Logs (Dashboard → eqb-api → Logs)
2. Verifica DATABASE_URL è corretto
3. Verifica database è accessibile (SQL test query)
4. Restart service (Dashboard → eqb-api → Restart)
```

### Web non si connette all'API
```
1. Apri DevTools (F12) → Network tab
2. Guarda le richieste API
3. Verifica NEXT_PUBLIC_API_URL in Vercel
4. Verifica CORS (dovrebbe essere ok)
```

### Cold start troppo lento
```
1. È normale sul free tier
2. Aspetta ~60 secondi prima di retry
3. Considera upgrade a Render Pro/Vercel Pro
```

---

**Sei live! Congratulazioni! 🚀**

Data completamento: _______________
Note finali:

_________________________________________________________________

_________________________________________________________________
