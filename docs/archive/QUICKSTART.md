# 🚀 GUIDA RAPIDA - AVVIO PROGETTO EQB

## 📋 Pre-requisiti

- Node.js 20+ ([scarica](https://nodejs.org/))
- Docker & Docker Compose ([scarica](https://www.docker.com/products/docker-desktop/))
- pnpm (`npm install -g pnpm`)
- VS Code + GitHub Copilot

## 🎯 Quick Start (5 minuti)

### 1️⃣ Installazione Dipendenze

```bash
cd "c:\Users\luana\Desktop\AI AGENCY\00 PROGETTI\EQB PIATTAFORMA"
pnpm install
```

### 2️⃣ Setup Environment

```bash
# Copiare file di esempio
copy .env.example .env.local
```

**Modificare `.env.local`:**
```env
DATABASE_URL=postgresql://eqb_user:eqb_password@localhost:5432/eqb_dev
REDIS_URL=redis://localhost:6379
API_PORT=3001
WEB_BASE_URL=http://localhost:3000
AUTH0_SECRET=your_secret  # TODO: configurare
```

### 3️⃣ Avviare Database

```bash
docker-compose up -d postgres redis
```

**Verificare container running:**
```bash
docker ps
```

### 4️⃣ Setup Database

```bash
# Eseguire migrazioni Prisma
pnpm run db:migrate

# Seed dati di test
pnpm run db:seed
```

### 5️⃣ Avvio Applicazione

```bash
# Terminal 1: Backend API
cd apps/api
pnpm run dev
# Verrà avviato su http://localhost:3001

# Terminal 2: Frontend Web
cd apps/web
pnpm run dev
# Verrà avviato su http://localhost:3000
```

## ✅ Test Accesso

**Frontend:**
- Apri http://localhost:3000
- Dovresti vedere la welcome page

**Backend:**
- Apri http://localhost:3001/health
- Response: `{"status":"ok", ...}`

**Database:**
```bash
pnpm run db:studio
# Apri Prisma Studio per visualizzare dati
```

---

## 📁 Struttura Principale

```
├── apps/
│   ├── api/          👈 Backend Express (port 3001)
│   └── web/          👈 Frontend Next.js (port 3000)
├── packages/
│   ├── shared-types/ Tipi TypeScript condivisi
│   └── ui-components/ Componenti React riusabili
├── docker-compose.yml Database & Redis
└── .env.local        Variabili ambiente
```

---

## 🛠️ Comandi Utili

```bash
# Da root folder

# Sviluppo
pnpm run dev           # Avvia backend + frontend
pnpm run dev --filter=@eqb/api      # Solo backend
pnpm run dev --filter=@eqb/web      # Solo frontend

# Build
pnpm run build         # Build tutto
pnpm run lint          # Lint code
pnpm run format        # Format con Prettier

# Database
pnpm run db:migrate    # Migrazioni
pnpm run db:seed       # Seed test data
pnpm run db:studio     # Prisma Studio

# Docker
docker-compose up -d   # Avvia services
docker-compose down    # Ferma services
docker-compose logs    # Visualizza logs
```

---

## 🔌 API Principali

### Auth Routes
```bash
POST   /api/auth/callback     # Auth0 callback
GET    /api/auth/me           # Get current user
POST   /api/auth/logout       # Logout
```

### Appointments Routes
```bash
GET    /api/appointments      # List appointments
POST   /api/appointments      # Create appointment
GET    /api/appointments/:id  # Get appointment
DELETE /api/appointments/:id  # Cancel appointment
```

**Test con cURL:**
```bash
# Health check
curl http://localhost:3001/health

# Get appointments
curl -X GET http://localhost:3001/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Configurazione Auth0 (TODO)

1. Crea account [Auth0](https://auth0.com)
2. Crea Application (Regular Web App)
3. Copia credentials in `.env.local`:
```env
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
```

---

## 📦 Dati di Test

Quando esegui `pnpm run db:seed`:

**Admin:**
- Email: `admin@eqb.it`
- Ruolo: ADMIN

**Coworker:**
- Email: `coworker1@eqb.it`
- Nome: Marco Rossi
- IBAN: IT60X0542811101000000123456

**Clients:**
- Giovanni Bianchi (giovanni@example.com)
- Anna Verdi (anna@example.com)

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Cambia port in .env.local
API_PORT=3002      # da 3001 a 3002
WEB_BASE_URL=3001  # adatta di conseguenza

# Oppure kill processo
lsof -i :3001
kill -9 <PID>
```

### "Database connection error"
```bash
# Verifica connessione
docker exec eqb-postgres psql -U eqb_user -d eqb_dev -c "SELECT 1"

# Restart containers
docker-compose restart postgres redis
```

### "Module not found"
```bash
# Clear cache e reinstalla
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📚 Documentazione Completa

Vedi [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) per:
- Stato implementazione dettagliato
- File creati per ogni step
- Timeline completamento
- Prossimi step

---

## 🚀 Prossimi Passi

Dopo avvio:

1. **Configurare Auth0** (vedi sopra)
2. **Implementare login/signup** (STEP 1)
3. **Creare appuntamenti** (STEP 2)
4. **Dashboard appuntamenti** (STEP 2)

Consulta [docs/README.md](./docs/README.md) per guida completa.

---

**✨ Pronto a partire? Esegui questi comandi:**

```bash
pnpm install
docker-compose up -d postgres redis
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
# 🎉 Open http://localhost:3000
```

---

**Dubbi? Consulta il file allegato: `eqb-implementation-guide.md`**
