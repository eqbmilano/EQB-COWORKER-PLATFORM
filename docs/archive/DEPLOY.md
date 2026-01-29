# 🚀 Guida al Deploy - EQB Platform

## Architettura Deploy

- **Frontend (Next.js)**: Vercel
- **Backend (Express API)**: Railway o Render
- **Database**: Railway PostgreSQL o Neon
- **Redis**: Upstash Redis o Railway Redis

---

## 📱 Deploy Frontend su Vercel

### 1. Preparazione Repository

```bash
# Assicurati che il progetto sia su GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tuo-username/eqb-platform.git
git push -u origin main
```

### 2. Importa su Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Clicca "Add New Project"
3. Importa il repository GitHub
4. Configura:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3. Variabili d'Ambiente Vercel

Aggiungi in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### 4. Deploy

Clicca "Deploy" - Vercel builderà e deployerà automaticamente.

---

## 🔧 Deploy Backend su Railway

### 1. Setup Database PostgreSQL

1. Vai su [railway.app](https://railway.app)
2. New Project → Provision PostgreSQL
3. Copia il `DATABASE_URL` dalla dashboard

### 2. Setup Redis

1. Nello stesso progetto Railway → Add Service → Redis
2. Copia il `REDIS_URL`

### 3. Deploy Backend API

1. Nel progetto Railway → New → GitHub Repo
2. Seleziona il repository
3. Configura:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`

### 4. Variabili d'Ambiente Railway

Aggiungi in Railway → Variables:

```bash
DATABASE_URL=postgresql://...  # Copiato dal PostgreSQL service
REDIS_URL=redis://...          # Copiato dal Redis service
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
SENDGRID_API_KEY=SG.your-key
FROM_EMAIL=noreply@eqbplatform.com
FROM_NAME=EQB Platform
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-south-1
AWS_S3_BUCKET_NAME=eqb-platform-documents
WEB_BASE_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### 5. Run Migrations

Nel Railway dashboard, apri il terminal del servizio API:

```bash
npx prisma migrate deploy
npx prisma db seed  # Se hai un seed file
```

### 6. Ottieni l'URL Backend

Railway genererà un URL tipo: `https://eqb-api-production.up.railway.app`

### 7. Aggiorna Vercel

Torna su Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://eqb-api-production.up.railway.app
```

Rideploya il frontend (Vercel → Deployments → tre puntini → Redeploy).

---

## 🗄️ Alternative per Database

### Opzione A: Neon PostgreSQL (Serverless)

1. Vai su [neon.tech](https://neon.tech)
2. Crea un progetto
3. Copia il `DATABASE_URL`
4. Usa in Railway o nel tuo backend

### Opzione B: Supabase

1. Vai su [supabase.com](https://supabase.com)
2. New Project
3. Copia la connection string PostgreSQL

---

## 📧 Setup SendGrid

1. Vai su [sendgrid.com](https://sendgrid.com)
2. Settings → API Keys → Create API Key
3. Permessi: Full Access
4. Copia la key (inizia con `SG.`)
5. Settings → Sender Authentication → Verify Single Sender
6. Verifica la tua email

---

## ☁️ Setup AWS S3

### Crea Bucket S3

```bash
# Via AWS Console
1. S3 → Create bucket
2. Nome: eqb-platform-documents
3. Region: eu-south-1 (Milano)
4. Block all public access: NO
5. Create bucket
```

### Configura CORS

Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-vercel-app.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Crea IAM User

1. IAM → Users → Add users
2. Nome: eqb-platform-s3-user
3. Access type: Programmatic access
4. Attach policies: `AmazonS3FullAccess`
5. Copia `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`

---

## 🔄 Redis per Job Queues

### Opzione A: Upstash Redis (Serverless)

1. Vai su [upstash.com](https://upstash.com)
2. Create Database
3. Copia `REDIS_URL`

### Opzione B: Railway Redis

Già coperto sopra - incluso nel progetto Railway.

---

## 🧪 Test del Deploy

### Test Backend

```bash
curl https://your-backend.up.railway.app/health
```

### Test Frontend

Apri: `https://your-vercel-app.vercel.app`

### Test Login

1. Vai su `/login`
2. Crea un admin iniziale tramite Prisma Studio:

```bash
# Nel Railway terminal
npx prisma studio
```

O crea via SQL:

```sql
INSERT INTO "User" (id, email, password, role, status)
VALUES (
  'cuid-here',
  'admin@eqb.com',
  -- Password hashata con bcrypt per "admin123"
  '$2b$10$YourHashedPasswordHere',
  'ADMIN',
  'ACTIVE'
);
```

---

## 🔐 Sicurezza Post-Deploy

1. **JWT_SECRET**: Usa un valore random di almeno 32 caratteri
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **CORS**: Configura in `apps/api/src/server.ts`:
   ```typescript
   app.use(cors({
     origin: process.env.WEB_BASE_URL || 'http://localhost:3000',
     credentials: true
   }));
   ```

3. **Rate Limiting**: Già configurato con express-rate-limit

4. **HTTPS**: Automatico su Vercel e Railway

---

## 📊 Monitoraggio

### Railway Logs

Railway Dashboard → Logs (real-time)

### Vercel Logs

Vercel Dashboard → Deployments → View Function Logs

### Prisma Studio

```bash
# Locale con tunnel al DB Railway
DATABASE_URL="postgresql://..." npx prisma studio
```

---

## 🚨 Troubleshooting

### Errore: "Cannot connect to database"

- Verifica che `DATABASE_URL` sia corretto
- Controlla che Railway PostgreSQL sia running
- Verifica che le migrations siano state eseguite

### Errore: "Queue error" 

- Verifica che `REDIS_URL` sia configurato
- Controlla che Railway Redis sia running

### Errore: "CORS policy"

- Verifica `WEB_BASE_URL` nel backend
- Controlla la configurazione CORS in server.ts

### Build fallito su Vercel

- Verifica che tutte le dipendenze siano in `package.json`
- Controlla che non ci siano errori TypeScript
- Verifica che `apps/web` compili localmente: `npm run build`

---

## 📝 Checklist Deploy

- [ ] Repository su GitHub
- [ ] Database PostgreSQL (Railway/Neon)
- [ ] Redis (Railway/Upstash)
- [ ] Backend deployato (Railway)
- [ ] Migrations eseguite
- [ ] Variabili d'ambiente backend configurate
- [ ] Frontend deployato (Vercel)
- [ ] Variabili d'ambiente frontend configurate
- [ ] SendGrid configurato
- [ ] AWS S3 bucket creato e configurato
- [ ] Test login funzionante
- [ ] Test creazione appuntamento
- [ ] Test upload documento

---

## 💰 Costi Stimati (Tier Gratuiti)

- **Vercel**: Gratis (Hobby plan)
- **Railway**: $5/mese dopo 500h gratis
- **Neon**: Gratis (1 progetto)
- **Upstash**: Gratis (10K comandi/giorno)
- **SendGrid**: Gratis (100 email/giorno)
- **AWS S3**: ~$0.023/GB/mese

**Totale stimato**: $5-10/mese

---

## 🎯 Prossimi Passi

1. Segui questa guida step-by-step
2. Testa ogni componente dopo il deploy
3. Configura il dominio custom (opzionale)
4. Setup backup automatici database
5. Configura monitoring (Sentry, LogRocket)

---

Per assistenza: Controlla i log su Railway/Vercel o apri un'issue.
