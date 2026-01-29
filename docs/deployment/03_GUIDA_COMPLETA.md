# 🚀 SETUP FINALE - RENDER + VERCEL DEPLOY

**Data:** 29 Gennaio 2026  
**Status:** Pronto per live deployment  
**Tempo stimato:** 20 minuti

---

## 📋 STEP 1: Applica Schema Database su Render (5 min)

### 1.1 Accedi a Render Database
1. Vai a: https://dashboard.render.com/
2. Clicca su **eqb-platform-db** (PostgreSQL)
3. Cerca il tab **SQL Editor** oppure **Connect**
4. Copia questo comando per connetterti:
```bash
psql "postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform"
```

### 1.2 Esegui Script SQL
1. Apri il file: [SQL_SETUP_POSTGRES.sql](SQL_SETUP_POSTGRES.sql)
2. Copia **TUTTO il contenuto**
3. Vai nel SQL Editor di Render
4. Incolla e click **Run All**
5. Attendi completamento (~30 secondi)

**Cosa fa lo script:**
- ✅ Crea tutti i 24 tables
- ✅ Crea tutti gli indici
- ✅ Crea admin user: admin@eqb.it / AdminEQB2026!

### 1.3 Verifica Setup
Nel SQL Editor, esegui:
```sql
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT email, role FROM "User" WHERE email = 'admin@eqb.it';
```

Dovrebbe ritornare:
```
total_tables | 24
admin@eqb.it | ADMIN
```

---

## 🔧 STEP 2: Configura Render API (5 min)

### 2.1 Crea Web Service su Render
1. Vai a: https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Seleziona **Connect to GitHub** → **eqbmilano/EQB-COWORKER-PLATFORM**
4. Click **Connect**

### 2.2 Configura Dettagli
```
Nome: eqb-api
Ramo: main
Ambiente: Node
Root Directory: (lascia vuoto)
Build Command: npm install && npm run build --workspace=@eqb/api
Start Command: npm --prefix apps/api start
```

### 2.3 Aggiungi Environment Variables
Click **Environment** e aggiungi:

```env
DATABASE_URL=postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform
JWT_SECRET=eqb-jwt-secret-2026-super-secure-key-change-in-prod
NODE_ENV=production
API_PORT=10000
```

### 2.4 Deploy API
1. Click **Create Web Service**
2. Attendi build (~5-10 minuti)
3. Quando è verde ✅ Deployed, Render assegna URL

**URL Render API:** `https://eqb-api.onrender.com`

### 2.5 Verifica API
Una volta deployata, testa:
```bash
curl -X GET https://eqb-api.onrender.com/api/health
```

Se vedi `{"status":"ok"}` o simile = ✅ API funziona!

---

## 🌐 STEP 3: Deploy Web su Vercel (5 min)

### 3.1 Vai su Vercel
1. Vai a: https://vercel.com/new
2. Click **Import Git Repository**
3. Seleziona **eqbmilano/EQB-COWORKER-PLATFORM**
4. Click **Import**

### 3.2 Configura Progetto
```
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Root Directory: apps/web
Install Command: npm install
```

### 3.3 Aggiungi Environment Variables
Aggiungi in Vercel:
```env
NEXT_PUBLIC_API_URL=https://eqb-api.onrender.com
NODE_ENV=production
```

### 3.4 Deploy Web
1. Click **Deploy**
2. Attendi ~3-5 minuti
3. Quando è pronto, Vercel assegna URL

**URL Vercel Web:** `https://eqb-coworker-platform.vercel.app`

---

## ✅ STEP 4: Test Completo (5 min)

### 4.1 Test API Login
```powershell
$apiUrl = "https://eqb-api.onrender.com"
$response = curl -X POST "$apiUrl/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@eqb.it",
    "password": "AdminEQB2026!"
  }'

Write-Host $response
```

Se ricevi un token JWT come:
```json
{"token": "eyJhbGciOiJIUzI1NiIs..."}
```

✅ **API funziona!**

### 4.2 Test Web App
1. Vai a: `https://eqb-coworker-platform.vercel.app`
2. Clicca **Login**
3. Usa:
   - Email: `admin@eqb.it`
   - Password: `AdminEQB2026!`
4. Se accedi al dashboard = ✅ **Web funziona!**

---

## 📊 CHECKLIST FINALE

### Database ✅
- [ ] Schema creato (24 tables)
- [ ] Admin user creato
- [ ] Verifica query ritorna risultati

### API ✅
- [ ] Web Service creato su Render
- [ ] Environment variables configurate (DATABASE_URL!)
- [ ] Deploy completato (status GREEN)
- [ ] Health check funziona

### Web ✅
- [ ] Importato su Vercel
- [ ] Environment variables configurate (NEXT_PUBLIC_API_URL!)
- [ ] Deploy completato
- [ ] Page carica

### Testing ✅
- [ ] API /auth/login ritorna token
- [ ] Web app si carica
- [ ] Login funziona
- [ ] Dashboard accessibile

---

## 🔗 URL FINALI

Una volta completato:

```
🌐 Frontend:  https://eqb-coworker-platform.vercel.app
🔧 API:       https://eqb-api.onrender.com
🗄️ Database:  PostgreSQL on Render (dpg-d5ppp3juibrs73d6dh30-a)
👤 Admin:     admin@eqb.it / AdminEQB2026!
```

---

## 🐛 TROUBLESHOOTING

### API restituisce 500 su /api/auth/login
```
✅ Verifica DATABASE_URL in Render Environment
✅ Verifica migrations applicate
✅ Verifica admin user esiste: SELECT * FROM "User" WHERE email='admin@eqb.it'
✅ Controlla Render Logs per errori
```

### Web non si connette all'API
```
✅ Verifica NEXT_PUBLIC_API_URL in Vercel
✅ Verifica CORS configurato nell'API (dovrebbe essere già ok)
✅ Apri browser DevTools → Network → controlla richieste API
```

### API deployment fallisce
```
✅ Controlla Render Logs
✅ Verifica Build Command: npm install && npm run build --workspace=@eqb/api
✅ Verifica Start Command: npm --prefix apps/api start
✅ Verifica DATABASE_URL è configurato prima del deploy
```

### Cold start lento su Render
```
✅ Questo è normale su free tier (30-60s al primo carico)
✅ Considera upgrade a paid tier per production
```

---

## 📞 LINK UTILI

- **Render Dashboard:** https://dashboard.render.com/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/eqbmilano/EQB-COWORKER-PLATFORM
- **API Documentation:** [SETUP.md](SETUP.md)
- **Troubleshooting Database:** [RENDER_TROUBLESHOOTING.md](RENDER_TROUBLESHOOTING.md)

---

## ⏱️ TIMING

| Step | Tempo |
|------|-------|
| Setup Database SQL | 3 min |
| Deploy API Render | 5-10 min |
| Deploy Web Vercel | 3-5 min |
| Testing | 5 min |
| **TOTALE** | **~25 min** |

---

## 🎯 PROSSIMI STEP (Dopo Deploy)

1. **Monitora Logs:**
   - Render: Dashboard → Logs
   - Vercel: Dashboard → Logs

2. **Aggiungi Dati Test:**
   - Crea coworkers/clients per testing
   - Crea appointments
   - Verifica flow completo

3. **Configura Produzione:**
   - Cambia JWT_SECRET a valore casuale
   - Configura email SMTP se necessario
   - Aggiungi dominio custom

4. **Ottimizzazioni:**
   - Abilita autoscaling su Render (paid)
   - Monitora performance in Vercel Analytics
   - Setup monitoring/alerting

---

**Sei pronto! Inizia dallo STEP 1!** 🚀

Quando hai completato ogni step, dimmi e posso aiutarti con il next.
