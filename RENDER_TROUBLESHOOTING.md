# 🔴 RENDER DEPLOYMENT TROUBLESHOOTING

## Problema Riportato
```
404 su endpoint non specificato
500 su /api/auth/login
Login error: Error: Login failed
```

## Diagnosi

### Causa Probabile: Database Non Configurato
L'errore 500 su login suggerisce che:
1. Database PostgreSQL non è raggiungibile da Render
2. Oppure DATABASE_URL non è configurato
3. Oppure admin user non esiste nel database di Render

### Status Attuale
- ✅ Web app deploya correttamente
- ❌ API restituisce 500 sulla rotta login
- ❌ Database probabile non connesso

---

## ✅ CHECKLIST RENDER

### Step 1: Verifica Variabili d'Ambiente
1. Vai a https://dashboard.render.com
2. Seleziona il servizio **API**
3. Vai a **Environment**
4. Verifica che EXISTS:
   ```
   DATABASE_URL="postgresql://user:password@host/dbname"
   JWT_SECRET="your_secret_key"
   NODE_ENV="production"
   ```

**Se mancano**: Aggiungi tutte le variabili richieste!

### Step 2: Configura PostgreSQL
**Opzione A: Neon (Consigliato)**
1. Vai a https://neon.tech/
2. Crea account (usa GitHub)
3. Crea nuovo progetto
4. Copia connection string
5. Aggiorna DATABASE_URL in Render

**Opzione B: Render PostgreSQL Addon**
1. In Render, aggiungi un servizio PostgreSQL
2. Collega il database al servizio API
3. Render configura DATABASE_URL automaticamente

### Step 3: Esegui Migrazioni
Dopo configurare DATABASE_URL:

**Opzione A: SSH in Render**
```bash
# Non disponibile su free tier
```

**Opzione B: Script di migrazione automatico**
Aggiungi al `package.json` di API:
```json
"build": "echo 'Skipping TypeScript compilation' && prisma generate && npx prisma migrate deploy"
```

**Opzione C: Crea admin manualmente (Neon Console)**
1. Vai a Neon console
2. Esegui SQL:
```sql
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, status, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@eqb.it',
  '$2b$10$salt_and_hashed_password_here',
  'Admin',
  'EQB',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);
```

### Step 4: Verifica Logs Render
1. Nel dashboard API, vai a **Logs**
2. Cerca errori di database connection
3. Verifica se migrations hanno errori

---

## 🚨 ERRORI COMUNI

### 500 su Login
**Causa**: Database connection error
**Fix**:
- [ ] Verifica DATABASE_URL configurato
- [ ] Verifica PostgreSQL URL è corretto
- [ ] Verifica migrazioni applicate
- [ ] Verifica admin user esiste

### 404 su Endpoint
**Causa**: Possibile problemi con API routing
**Fix**:
- [ ] Verifica API sta runando
- [ ] Controlla logs Render
- [ ] Verifica URL endpoint corretto

---

## 📋 DEPLOY CORRETTO (Step by Step)

### 1. Local Testing
```bash
cd "c:\Users\luana\Desktop\AI AGENCY\00 PROGETTI\EQB PIATTAFORMA"
npm run build      # ✓ Deve compilare
npm run dev        # ✓ API deve avviarsi su 5401
```

### 2. GitHub Push
```bash
git status         # Verifica no uncommitted changes
git push origin main  # Push a GitHub
```

### 3. Render Configuration
1. **Database Setup**
   - [ ] Crea PostgreSQL su Neon/Render
   - [ ] Copia connection string
   - [ ] Aggiungi a Render Environment: DATABASE_URL

2. **Migration**
   - [ ] Esegui migrations (manually o via script)
   - [ ] Verifica schema applicato

3. **Admin User**
   - [ ] Crea admin user via Neon console o script
   - [ ] Verifica email: admin@eqb.it

4. **Deploy**
   - [ ] Trigger manual deploy
   - [ ] Monitora logs
   - [ ] Testa login

---

## 🧪 TEST SU RENDER

Dopo deploy:

### Test 1: Health Check
```bash
curl https://eqb-coworker-platform.onrender.com/api/health
# Expect: 200 OK
```

### Test 2: Login Endpoint
```bash
curl -X POST https://eqb-coworker-platform.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eqb.it",
    "password": "AdminEQB2026!"
  }'
# Expect: 200 + JWT token
```

### Test 3: Dashboard
```
https://eqb-coworker-platform.onrender.com/login
# Should load, login should work
```

---

## 📊 ENVIRONMENT VARIABLES NECESSARIE

```env
# Database (CRITICO)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# API Config
JWT_SECRET="very-long-random-secret-string-here"
NODE_ENV="production"
API_PORT="5401"

# Email (Opzionale)
SENDGRID_API_KEY="optional-sendgrid-key"

# Jobs (Opzionale)
REDIS_URL="optional-redis-url"
```

---

## 🔗 RISORSE UTILI

- **Render Dashboard**: https://dashboard.render.com
- **Neon Console**: https://console.neon.tech
- **Prisma Migrate**: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
- **PostgreSQL Connection String**: https://www.postgresql.org/docs/current/libpq-connect.html

---

## ❓ PROSSIMO STEP

1. **Verifica DATABASE_URL** su Render (CRITICO!)
2. **Esegui migrazioni** (SQL o script)
3. **Crea admin user** (SQL o script)
4. **Retest login** su Render

Se ancora non funziona, controlla **Render logs** per errori specifici database.

---

**Aggiornato**: 27 Gennaio 2026
**Status**: 🔴 Requires Database Configuration on Render
