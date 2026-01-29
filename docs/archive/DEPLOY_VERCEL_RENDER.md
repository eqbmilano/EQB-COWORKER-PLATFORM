# 🚀 Deploy su Vercel + Render

Guida completa per deployare EQB Platform su **Vercel** (frontend) e **Render** (backend).

---

## 📋 Prerequisiti

- Account [Vercel](https://vercel.com)
- Account [Render](https://render.com)
- Repository GitHub
- Account SendGrid (opzionale, per email)
- Account AWS S3 (opzionale, per upload documenti)

---

## 1️⃣ Prepara Repository GitHub

```bash
cd "c:\Users\luana\Desktop\AI AGENCY\00 PROGETTI\EQB PIATTAFORMA"

# Inizializza Git
git init
git add .
git commit -m "Initial commit - EQB Platform"

# Crea repository su GitHub e pusha
git remote add origin https://github.com/tuo-username/eqb-platform.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ Deploy Backend su Render

### Opzione A: Deploy Automatico con render.yaml (Consigliato)

1. Vai su **[dashboard.render.com](https://dashboard.render.com)**
2. Clicca **"New +"** → **"Blueprint"**
3. Connetti il tuo repository GitHub
4. Render rileverà automaticamente `render.yaml`
5. Clicca **"Apply"**

Render creerà automaticamente:
- ✅ Web Service (API)
- ✅ PostgreSQL Database
- ✅ Redis Instance

### Opzione B: Setup Manuale

#### Crea Database PostgreSQL

1. Dashboard Render → **"New +"** → **"PostgreSQL"**
2. Nome: `eqb-db`
3. Database Name: `eqb_platform`
4. Region: Frankfurt (o più vicina)
5. Plan: **Free** (per test)
6. Clicca **"Create Database"**
7. Copia l'**Internal Database URL** (inizia con `postgresql://`)

#### Crea Redis

1. **"New +"** → **"Redis"**
2. Nome: `eqb-redis`
3. Plan: **Free**
4. Clicca **"Create Redis"**
5. Copia la **Connection String**

#### Crea Web Service (API)

1. **"New +"** → **"Web Service"**
2. Connetti repository GitHub
3. Configurazione:
   - **Name**: `eqb-api`
   - **Region**: Frankfurt
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: Node
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
   - **Plan**: Free (512 MB RAM)

4. **Environment Variables** (clicca "Advanced" → "Add Environment Variable"):

   ```bash
   NODE_ENV=production
   PORT=3001
   
   # Database (copia da PostgreSQL service)
   DATABASE_URL=postgresql://user:password@host/eqb_platform
   
   # Redis (copia da Redis service)
   REDIS_URL=redis://red-xxx:6379
   
   # JWT (genera stringa random 32+ caratteri)
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   
   # Email SendGrid (opzionale)
   SENDGRID_API_KEY=SG.your-key
   FROM_EMAIL=noreply@eqbplatform.com
   FROM_NAME=EQB Platform
   
   # AWS S3 (opzionale)
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=eu-south-1
   AWS_S3_BUCKET_NAME=eqb-platform-documents
   
   # Frontend URL (aggiungerai dopo)
   WEB_BASE_URL=https://your-app.vercel.app
   
   LOG_LEVEL=info
   ```

5. Clicca **"Create Web Service"**

#### Run Database Migrations

1. Attendi che il deploy finisca (2-5 minuti)
2. Vai su service → **Shell** (tab in alto)
3. Esegui:
   ```bash
   npx prisma migrate deploy
   ```

4. Copia l'URL del servizio (es: `https://eqb-api.onrender.com`)

---

## 3️⃣ Deploy Frontend su Vercel

### Setup Vercel

1. Vai su **[vercel.com/new](https://vercel.com/new)**
2. Importa il repository GitHub
3. Configurazione:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://eqb-api.onrender.com
   ```
   *(Usa l'URL che hai copiato da Render)*

5. Clicca **"Deploy"**

6. Attendi il build (2-3 minuti)

7. Copia l'URL Vercel (es: `https://eqb-platform.vercel.app`)

### Aggiorna Backend con URL Frontend

1. Torna su **Render** → servizio `eqb-api`
2. **Environment** → trova `WEB_BASE_URL`
3. Cambia in: `https://eqb-platform.vercel.app`
4. Clicca **"Save Changes"** (il servizio si riavvierà automaticamente)

---

## 4️⃣ Configurazione CORS (Backend)

Il CORS è già configurato nel backend per usare `WEB_BASE_URL`. Verifica in [apps/api/src/server.ts](c:\Users\luana\Desktop\AI AGENCY\00 PROGETTI\EQB PIATTAFORMA\apps\api\src\server.ts):

```typescript
app.use(cors({
  origin: process.env.WEB_BASE_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

## 5️⃣ Crea Primo Utente Admin

### Metodo 1: Via Prisma Studio (Locale)

```bash
# Nel tuo computer
cd apps/api

# Usa il DATABASE_URL di Render
DATABASE_URL="postgresql://..." npx prisma studio
```

Crea utente con:
- Email: `admin@eqb.com`
- Password: `admin123` (hashata con bcrypt)
- Role: `ADMIN`
- Status: `ACTIVE`

### Metodo 2: Via Shell Render

1. Render → servizio API → **Shell**
2. Crea script seed:

```bash
cat > seed-admin.js << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@eqb.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      firstName: 'Admin',
      lastName: 'User',
    },
  });
  
  console.log('Admin created:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF

node seed-admin.js
```

---

## 6️⃣ Test Completo

### Test Backend

```bash
# Health check
curl https://eqb-api.onrender.com/health

# Dovrebbe rispondere: {"status":"ok"}
```

### Test Frontend

1. Apri: `https://eqb-platform.vercel.app`
2. Vai su `/login`
3. Login con:
   - Email: `admin@eqb.com`
   - Password: `admin123`
4. Dovresti vedere la dashboard

### Test CRUD

1. Crea un nuovo appuntamento
2. Verifica che appaia nella lista
3. Modifica e elimina per testare

---

## 7️⃣ Configurazioni Opzionali

### Setup SendGrid (Email)

1. Vai su [sendgrid.com](https://sendgrid.com)
2. Crea account gratuito (100 email/giorno)
3. **Settings** → **API Keys** → **Create API Key**
4. Copia la key (inizia con `SG.`)
5. **Settings** → **Sender Authentication** → **Verify Single Sender**
6. Verifica la tua email

Aggiungi su Render:
```
SENDGRID_API_KEY=SG.your-key-here
FROM_EMAIL=tua-email-verificata@gmail.com
```

### Setup AWS S3 (Upload Documenti)

1. AWS Console → **S3** → **Create bucket**
2. Nome: `eqb-platform-documents`
3. Region: `eu-south-1` (Milano)
4. **Block all public access**: Disabilita
5. Crea bucket

6. **IAM** → **Users** → **Add users**
   - Nome: `eqb-s3-user`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Copia `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`

7. Bucket → **Permissions** → **CORS**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://eqb-platform.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Aggiungi su Render:
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-south-1
AWS_S3_BUCKET_NAME=eqb-platform-documents
```

---

## 8️⃣ Monitoraggio

### Logs Render

Render Dashboard → servizio → **Logs** (real-time)

### Logs Vercel

Vercel Dashboard → progetto → **Deployments** → clicca deploy → **Function Logs**

### Database

Render → PostgreSQL → **Info** → copia connection string
```bash
psql "postgresql://..."
```

---

## 9️⃣ Aggiornamenti

### Update Backend

```bash
git add .
git commit -m "Update backend"
git push
```

Render rebuilderà automaticamente.

### Update Frontend

```bash
git push
```

Vercel rebuilderà automaticamente.

### Update Database Schema

1. Modifica `apps/api/prisma/schema.prisma`
2. Crea migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Push su GitHub
4. Render → Shell:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔧 Troubleshooting

### Backend non si avvia

1. Controlla logs su Render
2. Verifica che `DATABASE_URL` sia corretto
3. Controlla che migrations siano state eseguite

### Frontend non si connette al backend

1. Verifica `NEXT_PUBLIC_API_URL` su Vercel
2. Controlla CORS nel backend
3. Verifica che backend sia running (health check)

### Errori database

```bash
# Render Shell
npx prisma migrate reset  # ATTENZIONE: cancella tutti i dati
npx prisma migrate deploy
```

### Free tier Render dorme dopo 15 min

Il piano gratuito Render mette in sleep i servizi dopo 15 minuti di inattività. Il primo accesso sarà lento (30-60 secondi) per il risveglio.

**Soluzioni:**
1. Upgrade a piano paid ($7/mese)
2. Usa [cron-job.org](https://cron-job.org) per ping ogni 10 minuti:
   ```
   GET https://eqb-api.onrender.com/health
   ```

---

## 💰 Costi

- **Vercel**: Gratis (Hobby plan, 100 GB bandwidth)
- **Render**: Gratis (Web Service + PostgreSQL + Redis free tier)
- **SendGrid**: Gratis (100 email/giorno)
- **AWS S3**: ~€0.023/GB/mese

**Totale**: €0-5/mese

---

## ✅ Checklist Deploy

- [ ] Repository su GitHub
- [ ] PostgreSQL creato su Render
- [ ] Redis creato su Render
- [ ] Backend deployato su Render
- [ ] Migrations eseguite
- [ ] Variabili d'ambiente backend configurate
- [ ] Frontend deployato su Vercel
- [ ] `NEXT_PUBLIC_API_URL` configurato
- [ ] `WEB_BASE_URL` aggiornato nel backend
- [ ] Admin user creato
- [ ] Test login funzionante
- [ ] SendGrid configurato (opzionale)
- [ ] AWS S3 configurato (opzionale)

---

## 🎯 Prossimi Passi

1. Configura dominio custom su Vercel (opzionale)
2. Setup monitoring (Sentry)
3. Backup automatico database
4. CI/CD con GitHub Actions
5. Setup staging environment

---

**Hai domande?** Controlla i logs o chiedi supporto! 🚀
