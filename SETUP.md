# 🚀 EQB Coworker Platform - SETUP & OPERATIONS

**Version:** 1.0.0 | **Date:** 27 Gennaio 2026 | **Status:** ✅ Production Ready

---

## ⚡ QUICK START (2 minuti)

### 1. Prerequisiti
- Node.js 20+ (`node -v`)
- npm 10+ (`npm -v`)

### 2. Avvia Progetto
```bash
# Setup (prima volta)
npm install
npm run build

# Sviluppo
npm run dev

# Accedi
Web:  http://localhost:5400
API:  http://localhost:5401
```

### 3. Login
```
Email: admin@eqb.it
Password: AdminEQB2026!
```

---

## 🛠️ CONFIGURAZIONE DATABASE

### ✅ Sviluppo (Attualmente Attivo)
**Database:** SQLite file-based  
**Location:** `apps/api/prisma/dev.db`  
**Setup:** Automatico - zero configurazione!

```bash
# Già configurato, niente da fare
# Database inizializzato con admin user
```

### 📊 Produzione (Per Deployment)
**Database:** PostgreSQL (Neon consigliato)

#### Setup PostgreSQL Neon (Gratuito)
1. Vai su https://neon.tech/
2. Crea account (usa GitHub per login rapido)
3. Crea nuovo progetto
4. Copia connection string
5. Aggiorna `.env.production`:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname"
   ```
6. Esegui migrazioni:
   ```bash
   cd apps/api
   NODE_ENV=production npx prisma migrate deploy
   ```

#### Alternative PostgreSQL
- **Docker Local:** `docker run -e POSTGRES_PASSWORD=postgres postgres:latest`
- **AWS RDS:** Managed PostgreSQL service
- **Railway:** One-click PostgreSQL deployment

---

## 🔐 CREDENZIALI ADMIN

### Default Admin User
```
📧 Email:    admin@eqb.it
🔑 Password: AdminEQB2026!
```

### Dopo Login
**IMPORTANTE:** Cambia password immediatamente!
1. Accedi con credenziali default
2. Vai a **Profile** → **Change Password**
3. Imposta password sicura (min 12 char, maiusc, numeri, simboli)

### Creare Nuovo Admin (Se Necessario)
```bash
cd apps/api
$env:DATABASE_URL="file:./prisma/dev.db"
npx tsx scripts/seedAdmin.ts
```

---

## 📋 FEATURES PRINCIPALI

### ✅ Authentication & Authorization
- Email/Password login con JWT
- Role-based access control (ADMIN, COWORKER, CLIENT)
- Password hashing con bcrypt
- Session management

### ✅ Dashboard
- Admin statistics
- Operator dashboard
- Backlog tracking
- Monthly recaps

### ✅ Gestione Dati
- Appointment scheduling
- Client management
- Invoice generation (CRUD + PDF export)
- Room/Desk booking

### ✅ Accessibility & UX
- WCAG 2.1 compliance
- Responsive design (Tailwind CSS)
- Keyboard navigation
- Screen reader support

---

## 🏗️ STACK TECNOLOGICO

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 14.2.35 |
| **Backend** | Express.js | 4.18.x |
| **Language** | TypeScript | 5.x |
| **Database** | SQLite (dev) / PostgreSQL (prod) | - |
| **ORM** | Prisma | 5.22.0 |
| **Auth** | JWT + bcrypt | - |
| **Styling** | Tailwind CSS | 3.x |
| **Build** | Turborepo | - |
| **Package Manager** | npm | 10+ |

---

## 📦 PACKAGE STRUCTURE

```
📦 apps/
├── api/              (Express Backend) PORT 5401
│   ├── src/
│   │   ├── routes/          (6 API routers)
│   │   ├── services/        (Business logic)
│   │   ├── middleware/      (Auth, RBAC)
│   │   ├── jobs/            (Background jobs)
│   │   └── database/        (Prisma)
│   └── prisma/
│       └── dev.db           (SQLite development)
│
└── web/              (Next.js Frontend) PORT 5400
    ├── src/
    │   ├── app/             (App Router)
    │   ├── components/      (React components)
    │   ├── hooks/           (Custom hooks)
    │   └── store/           (State management)
    └── .env.local          (Frontend config)

📦 packages/
├── shared-types/    (TypeScript types)
└── ui-components/   (Reusable components)
```

---

## 🔧 COMANDI PRINCIPALI

### Development
```bash
npm run dev          # Start all servers (web + api)
npm run build        # Production build (all packages)
npm run lint         # Check code quality
npm run test         # Run tests (if available)
```

### API Only
```bash
cd apps/api
npm run dev          # Start API server only (5401)
npm run build        # Build API
npx prisma studio   # Open Prisma GUI (view/edit DB)
```

### Web Only
```bash
cd apps/web
npm run dev          # Start web server only (5400)
npm run build        # Build web app
```

### Database
```bash
cd apps/api
npx prisma migrate dev       # Create new migration
npx prisma migrate deploy    # Deploy production migrations
npx prisma studio           # GUI database editor
npx prisma seed             # Run seed script
```

---

## 🌍 DEPLOYMENT

### Render (Consigliato)
1. **Push code su GitHub**
2. **Vai su** https://render.com/
3. **Connect repository**
4. **Configura environment:**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_secret_here
   NODE_ENV=production
   ```
5. **Deploy** (auto from main branch)

**Nota:** Il file `build` di Render esegue:
```bash
npm install && npm run build --workspace=@eqb/api
```

### Vercel (Per Web App)
1. **Import repository** in Vercel
2. **Root directory:** `apps/web`
3. **Build command:** `npm run build`
4. **Configura API_URL** in environment

### Environment Variables

**Development** (`.env.local`):
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="dev_secret_key_change_in_production"
API_PORT=5401
```

**Production** (Render/Vercel):
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="very_long_secure_random_string"
SENDGRID_API_KEY="optional_for_emails"
REDIS_URL="optional_for_background_jobs"
```

---

## 🐛 TROUBLESHOOTING

### "Cannot find module" error
```bash
# Clean install
rm -r node_modules package-lock.json
npm install
npm run build
```

### Database connection error
```bash
# Dev: Verifica DATABASE_URL
echo $env:DATABASE_URL

# Prod: Verifica PostgreSQL è raggiungibile
psql postgresql://...
```

### Port already in use
```bash
# Find process using port
netstat -ano | findstr :5400  # Windows
netstat -ano | grep 5400      # Linux

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux
```

### Build fails
```bash
# Clear cache e riprova
npm run clean
npm install
npm run build
```

---

## 📊 DATABASE SCHEMA

### Tabelle Principali
- **User** - Users account e authentication
- **Appointment** - Scheduling appointments
- **AppointmentInvoice** - Invoicing system
- **Client** - Client profiles
- **Coworker** - Coworker profiles
- **Room** - Room/Desk management
- **BacklogEntry** - Capacity tracking

### Entity Relationships
```
User ──→ Appointments ──→ Invoices
      ──→ Clients
      ──→ Coworker Profile

Appointment ──→ Room
             ──→ Client
             ──→ Coworker
             ──→ Invoice
```

---

## ⚠️ KNOWN WARNINGS (Non-Blocking)

### ESLint/Stylelint
- **Inline styles:** Necessari per dynamic brand theming
- **ARIA attributes:** Dynamic values processed correctly
- **@tailwind directives:** Tailwind CSS valid

**Impatto:** Cosmetico - non bloccano deploy

### Runtime Warnings
- **SendGrid:** Non configurato (emails logged to console)
- **Redis:** Non configurato (background jobs queued synchronously)

**Impatto:** Features degradate ma non critiche per MVP

---

## 📚 DOCUMENTAZIONE

| File | Contenuto |
|------|-----------|
| **SETUP.md** | Questo file - Quick start e configuration |
| **README.md** | Panoramica completa del progetto |
| **COMPLETE_REVISION.md** | Revisione finale della sessione sviluppo |
| **FEATURES.md** | Lista completa delle feature |

---

## 🔗 LINK UTILI

- **GitHub:** https://github.com/eqbmilano/EQB-COWORKER-PLATFORM
- **Render:** https://dashboard.render.com
- **Neon DB:** https://neon.tech
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Express Docs:** https://expressjs.com

---

## 📞 SUPPORT

Per problemi o domande:
1. Controlla questa documentazione
2. Vedi COMPLETE_REVISION.md per session history
3. Controlla GitHub issues

---

**Last Updated:** 27 Gennaio 2026  
**Session Completed:** ✅ All systems operational
