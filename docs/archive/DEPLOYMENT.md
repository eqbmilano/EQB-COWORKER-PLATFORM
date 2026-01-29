# 🚀 EQB Platform - Deploy Ready

**Last Updated:** Commit `944f10a` - Admin panel + PDF generation complete

## ✅ What's Completed

- ✅ Custom JWT authentication (bcrypt + 7-day tokens)
- ✅ Admin user management panel
- ✅ PDF invoice generation (pdf-lib)
- ✅ EQB brand theme (wood palette, Manrope font)
- ✅ Database seed with test data:
  - admin@eqb.it / AdminEQB2026!
  - coworker@eqb.it / CoworkerEQB2026!
  - 3 clients + 3 appointments + 2 invoices
- ✅ Dashboard modules: Appointments, Clients, Profile, Calendar, Invoices
- ✅ RBAC middleware (Admin/Coworker roles)

---

## 📋 Passi Manuali Rimanenti

### 1️⃣ Database PostgreSQL su Render

**Azione**: Creare il database e collegarlo al Web Service

1. Vai su [Render Dashboard](https://dashboard.render.com)
2. Clicca **"New"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `eqb-platform-db`
   - **Database**: `eqb_platform`
   - **User**: `eqb_user`
   - **Region**: Frankfurt (EU Central)
   - **Plan**: Starter ($7/mese)
4. Clicca **"Create Database"**
5. Copia la **Internal Database URL**
6. Vai al Web Service **EQB-COWORKER-PLATFORM**
7. **Settings** → **Environment** → **Add Environment Variable**:
   - Key: `DATABASE_URL`
   - Value: [incolla la Internal Database URL]
8. Salva e redeploy

**Dopo il deploy, esegui le migration**:
```bash
# Da terminale locale
DATABASE_URL="[url-del-database]" npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

---

### 2️⃣ Auth0 Configuration

**Azione**: Configurare Auth0 per autenticazione utenti

1. Vai su [Auth0 Dashboard](https://manage.auth0.com)
2. Crea un nuovo **Tenant** (es: `eqb-platform`)
3. Crea una **Application** (tipo: Regular Web Application)
4. Configura **Allowed Callback URLs**:
   ```
   https://eqb-platform-web.vercel.app/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```
5. Configura **Allowed Logout URLs**:
   ```
   https://eqb-platform-web.vercel.app
   http://localhost:3000
   ```
6. Copia le credenziali e aggiungile su **Render** (Settings → Environment):
   ```
   AUTH0_DOMAIN=your-tenant.eu.auth0.com
   AUTH0_CLIENT_ID=[da Auth0]
   AUTH0_CLIENT_SECRET=[da Auth0]
   ```

7. Crea una **Machine to Machine Application** per l'API
8. Aggiungi su Render:
   ```
   AUTH0_M2M_CLIENT_ID=[da Auth0]
   AUTH0_M2M_CLIENT_SECRET=[da Auth0]
   ```

9. Aggiungi su **Vercel** (Settings → Environment Variables):
   ```
   NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.eu.auth0.com
   NEXT_PUBLIC_AUTH0_CLIENT_ID=[da Auth0]
   AUTH0_CLIENT_SECRET=[da Auth0]
   AUTH0_BASE_URL=https://eqb-platform-web.vercel.app
   ```

---

### 3️⃣ JWT Secret

**Azione**: Genera un JWT secret sicuro

Da terminale:
```bash
openssl rand -base64 32
```

Aggiungi su **Render** (Settings → Environment):
```
JWT_SECRET=[output del comando sopra]
```

---

### 4️⃣ SendGrid Email Service

**Azione**: Configurare SendGrid per email transazionali

1. Vai su [SendGrid](https://sendgrid.com)
2. Crea un account / Login
3. **Settings** → **API Keys** → **Create API Key**
4. Copia la API Key
5. Aggiungi su **Render** (Settings → Environment):
   ```
   SENDGRID_API_KEY=[api key]
   FROM_EMAIL=noreply@eqbplatform.com
   FROM_NAME=EQB Platform
   ```

**Nota**: Per usare un dominio custom (es: @eqbplatform.com), devi verificarlo su SendGrid.

---

### 5️⃣ AWS S3 per File Storage

**Azione**: Configurare S3 bucket per documenti clienti

1. Vai su [AWS Console](https://console.aws.amazon.com)
2. **Services** → **S3** → **Create Bucket**
3. Configura:
   - **Name**: `eqb-platform-documents`
   - **Region**: EU (Milan) - eu-south-1
   - **Block Public Access**: Attivo (privato)
4. Crea il bucket
5. **IAM** → **Users** → **Create User**:
   - **Name**: `eqb-platform-s3-user`
   - Attach policy: `AmazonS3FullAccess` (o custom policy per solo questo bucket)
6. Crea **Access Key** per l'utente
7. Aggiungi su **Render** (Settings → Environment):
   ```
   AWS_ACCESS_KEY_ID=[access key]
   AWS_SECRET_ACCESS_KEY=[secret key]
   AWS_REGION=eu-south-1
   AWS_S3_BUCKET_NAME=eqb-platform-documents
   ```

---

### 6️⃣ Update Frontend Environment su Vercel

**Azione**: Aggiungere variabili mancanti su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **eqb-platform-web**
3. **Settings** → **Environment Variables**
4. Aggiungi:
   ```
   NEXT_PUBLIC_API_URL=https://eqb-coworker-platform.onrender.com
   NEXT_PUBLIC_AUTH0_DOMAIN=[da Auth0]
   NEXT_PUBLIC_AUTH0_CLIENT_ID=[da Auth0]
   AUTH0_CLIENT_SECRET=[da Auth0]
   AUTH0_BASE_URL=https://eqb-platform-web.vercel.app
   ```
5. **Redeploy** il frontend (Deployments → Latest → ⋯ → Redeploy)

---

## 🔐 Checklist Finale

- [ ] Database PostgreSQL creato e collegato
- [ ] Migration Prisma eseguite (`prisma migrate deploy`)
- [ ] Auth0 configurato con callback URLs
- [ ] JWT_SECRET generato e impostato
- [ ] SendGrid API key configurata
- [ ] AWS S3 bucket creato con IAM user
- [ ] Tutte le env variables su Render aggiunte
- [ ] Tutte le env variables su Vercel aggiunte
- [ ] Frontend redeployato
- [ ] Backend redeployato (dopo env variables)
- [ ] Test login da frontend

---

## 🧪 Test Deployment

Dopo aver completato tutti i passi:

1. Vai su https://eqb-platform-web.vercel.app
2. Prova il **Login** (dovrebbe redirectare ad Auth0)
3. Controlla i logs su Render per verificare connessioni al database
4. Testa upload documenti (verifica S3)
5. Verifica ricezione email (SendGrid logs)

---

## 📞 Troubleshooting

### Frontend non si collega all'API
- Verifica che `NEXT_PUBLIC_API_URL` sia corretto su Vercel
- Controlla CORS settings nell'API (deve includere Vercel URL)

### Database connection errors
- Verifica che `DATABASE_URL` su Render sia la **Internal URL**
- Esegui `prisma migrate deploy` se ci sono pending migrations

### Auth0 redirect errors
- Controlla che le callback URLs su Auth0 includano Vercel URL
- Verifica `AUTH0_BASE_URL` su Vercel

### Email non inviate
- Controlla SendGrid API Key su Render
- Verifica dominio sender su SendGrid
- Controlla logs SendGrid per bounce/spam

### File upload errors
- Verifica IAM user permissions su AWS
- Controlla bucket CORS configuration
- Verifica AWS credentials su Render

---

## 🚀 Deployment Automatico

Ogni push su `main` trigghera automaticamente:
- ✅ Frontend su Vercel
- ✅ Backend su Render

Per deployare:
```bash
git add .
git commit -m "feat: nuovo feature"
git push origin main
```

---

## 📊 Monitoring

### Render
- Dashboard: https://dashboard.render.com
- Logs: Web Service → Logs
- Metrics: Web Service → Metrics

### Vercel
- Dashboard: https://vercel.com/dashboard
- Logs: Project → Deployments → Log
- Analytics: Project → Analytics

---

## 💰 Costi Mensili Stimati

| Servizio | Piano | Costo |
|----------|-------|-------|
| Vercel | Hobby | $0 |
| Render Web Service | Starter | $7 |
| Render PostgreSQL | Starter | $7 |
| SendGrid | Free (100 email/day) | $0 |
| AWS S3 | Pay-as-you-go | ~$1-5 |
| **TOTALE** | | **~$15-20/mese** |

---

## 🎯 Prossimi Step (Opzionali)

1. **Custom Domain**: Configura dominio custom su Vercel
2. **SSL Certificate**: Automatico su Vercel/Render
3. **Monitoring**: Integrare Sentry per error tracking
4. **Analytics**: Google Analytics o Plausible
5. **Backup**: Configurare backup automatico database su Render
6. **CI/CD**: Aggiungere GitHub Actions per test automatici
7. **Staging Environment**: Creare ambiente di test separato

---

**Data Setup**: 23 Gennaio 2026
**Versione**: 1.0.0
