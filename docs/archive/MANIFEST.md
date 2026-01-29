# 🗂️ Project Structure & File Manifest

**Last Updated:** 18 Gennaio 2026  
**Total Files:** 51  
**Total LOC:** ~3,500  
**Phase Status:** 1/4 (100%)

---

## 📂 Directory Structure

```
EQB PIATTAFORMA/
│
├── 📚 Documentation (8 files)
│   ├── START_HERE.md                 ← 👈 INIZIA QUI
│   ├── README.md                     ← Panoramica progetto
│   ├── 📖_INDICE.md                  ← Mappa documentazione
│   ├── ✅_COMPLETAMENTO.md           ← Checklist Phase 1
│   ├── QUICKSTART.md                 ← Setup in 5 min
│   ├── IMPLEMENTATION_STATUS.md      ← Dettagli tecnici
│   ├── RIEPILOGO.md                  ← Analisi strategica
│   ├── STRUTTURA.txt                 ← Visualizzazione directory
│   └── 🗓️_TIMELINE.md               ← Timeline 6 mesi
│
├── 📱 apps/api/ (Backend Express)
│   ├── src/
│   │   ├── middleware/auth.ts        (JWT, RBAC)
│   │   ├── routes/
│   │   │   ├── auth.ts              (POST /auth/callback, GET /auth/me, POST /auth/logout)
│   │   │   └── appointments.ts      (GET/POST appointments, DELETE)
│   │   ├── services/
│   │   │   ├── authService.ts       (User CRUD, Auth0)
│   │   │   └── appointmentService.ts (Appointment CRUD, business logic)
│   │   ├── database/
│   │   │   ├── client.ts            (Prisma singleton)
│   │   │   └── prisma.ts            (Config)
│   │   ├── utils/errorHandler.ts    (Error handling)
│   │   ├── validators/schemas.ts    (Zod validation)
│   │   ├── types/api.ts             (API types)
│   │   ├── server.ts                (Express app)
│   │   └── index.ts                 (Entry point)
│   ├── prisma/
│   │   ├── schema.prisma            (12 data models)
│   │   └── seed.ts                  (Test data)
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── 🌐 apps/web/ (Frontend Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            (Root layout)
│   │   │   ├── page.tsx              (Home page)
│   │   │   ├── globals.css           (TailwindCSS)
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx        (Auth layout)
│   │   │   │   ├── login/page.tsx    (Login page)
│   │   │   │   └── signup/page.tsx   (Signup page)
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx        (Protected dashboard)
│   │   │       └── dashboard/page.tsx (Stats + Calendar + Actions)
│   │   ├── components/
│   │   │   ├── appointments/
│   │   │   │   ├── AppointmentCalendar.tsx  (Month calendar)
│   │   │   │   └── AppointmentList.tsx      (List view)
│   │   │   ├── shared/
│   │   │   │   └── ProtectedRoute.tsx       (Route protection)
│   │   │   └── ...
│   │   ├── store/authStore.ts       (Zustand store)
│   │   ├── hooks/                   (Custom hooks)
│   │   ├── lib/                     (Utilities)
│   │   ├── types/                   (Local types)
│   │   └── styles/
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── 📦 packages/
│   ├── shared-types/
│   │   ├── src/index.ts            (25+ TypeScript interfaces)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ui-components/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Button.tsx       (Primary, secondary, danger variants)
│       │   │   ├── Modal.tsx        (Dialog component)
│       │   │   ├── Card.tsx         (Container)
│       │   │   ├── Badge.tsx        (Status badge)
│       │   │   ├── Alert.tsx        (Alert message)
│       │   │   └── index.ts         (Exports)
│       │   └── styles/tailwind.css
│       ├── package.json
│       └── tsconfig.json
│
├── 🔧 Infrastructure (Root Level)
│   ├── package.json                 (Workspaces config)
│   ├── tsconfig.json               (Base TS config)
│   ├── turbo.json                  (Build orchestration)
│   ├── .prettierrc                 (Code formatting)
│   ├── .eslintrc.json              (Linting)
│   ├── .gitignore
│   ├── .env.example                (Template variables)
│   └── docker-compose.yml          (PostgreSQL + Redis)
│
└── 📖 docs/
    ├── README.md
    ├── API.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    └── TROUBLESHOOTING.md
```

---

## 📊 File Statistics by Category

### Documentation (8 files)
| File | Lines | Tempo | Scopo |
|------|-------|-------|-------|
| START_HERE.md | 180 | 3 min | Punto d'ingresso |
| README.md | 270 | 5 min | Panoramica |
| 📖_INDICE.md | 280 | 2 min | Navigazione |
| ✅_COMPLETAMENTO.md | 320 | 5 min | Checklist |
| QUICKSTART.md | 450 | 5 min | Setup |
| IMPLEMENTATION_STATUS.md | 400 | 15 min | Dettagli |
| RIEPILOGO.md | 350 | 10 min | Analisi |
| 🗓️_TIMELINE.md | 1,200 | 5 min | Timeline |
| STRUTTURA.txt | 180 | 5 min | Visualizzazione |

### Backend (22 files)
| File | Lines | Scopo |
|------|-------|-------|
| auth.ts | 80 | JWT + RBAC middleware |
| authService.ts | 120 | User CRUD + Auth0 |
| appointmentService.ts | 280 | Appointment CRUD + business logic |
| auth.ts (routes) | 120 | API endpoints |
| appointments.ts (routes) | 180 | Appointment endpoints |
| schema.prisma | 450 | 12 data models |
| seed.ts | 200 | Test data |
| server.ts | 150 | Express setup |
| + Configuration (7 files) | 300 | Config files |

### Frontend (16 files)
| File | Lines | Scopo |
|------|-------|-------|
| login/page.tsx | 80 | Login form |
| signup/page.tsx | 100 | Signup form |
| dashboard/page.tsx | 120 | Dashboard |
| AppointmentCalendar.tsx | 180 | Calendar UI |
| AppointmentList.tsx | 120 | List UI |
| authStore.ts | 60 | Zustand state |
| layout.tsx files (2) | 120 | Layouts |
| + Config files (8) | 300 | Next.js + TailwindCSS |

### Shared Packages (6 files)
| File | Lines | Scopo |
|------|-------|-------|
| shared-types/index.ts | 400 | 25+ TypeScript interfaces |
| Button.tsx | 80 | UI component |
| Modal.tsx | 100 | UI component |
| Card.tsx | 60 | UI component |
| Badge.tsx | 40 | UI component |
| Alert.tsx | 50 | UI component |

### Infrastructure (7 files)
| File | Scopo |
|------|-------|
| package.json | Workspaces root |
| docker-compose.yml | PostgreSQL + Redis |
| .env.example | Environment template |
| tsconfig.json | Base TS config |
| turbo.json | Build orchestration |
| .prettierrc | Code formatting |
| .eslintrc.json | Linting |

---

## 🎯 Key Components by Feature

### 🔐 Authentication System
```
Frontend:
  - apps/web/src/app/(auth)/login/page.tsx
  - apps/web/src/app/(auth)/signup/page.tsx
  - apps/web/src/store/authStore.ts
  
Backend:
  - apps/api/src/middleware/auth.ts (JWT verification)
  - apps/api/src/services/authService.ts (User management)
  - apps/api/src/routes/auth.ts (API endpoints)
  
Database:
  - prisma/schema.prisma → User model
```

### 📅 Appointment Management
```
Frontend:
  - apps/web/src/components/appointments/AppointmentCalendar.tsx
  - apps/web/src/components/appointments/AppointmentList.tsx
  - apps/web/src/app/(dashboard)/dashboard/page.tsx
  
Backend:
  - apps/api/src/services/appointmentService.ts (CRUD)
  - apps/api/src/routes/appointments.ts (API)
  - apps/api/src/middleware/auth.ts (Protection)
  
Database:
  - prisma/schema.prisma → Appointment model
```

### 🎨 UI Component Library
```
Location: packages/ui-components/src/components/
- Button.tsx (primary, secondary, danger)
- Modal.tsx (dialog)
- Card.tsx (container)
- Badge.tsx (status)
- Alert.tsx (messages)
```

### 📊 Shared Types
```
Location: packages/shared-types/src/index.ts
- User & UserProfile types
- Appointment & related types
- API request/response types
- Database model interfaces
```

---

## 🔄 Development Workflow

### Local Development (All Services)
```bash
# Start all services
pnpm run dev

# Runs:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - Prisma Studio: http://localhost:5555
```

### Database Management
```bash
# Migrations
pnpm run db:migrate        # Run migrations
pnpm run db:push           # Push schema changes
pnpm run db:seed           # Seed test data

# Inspect
pnpm run db:studio         # Prisma Studio
```

### Code Quality
```bash
# Linting & Formatting
pnpm run lint              # Check linting
pnpm run format            # Auto-format code
pnpm run type-check        # TypeScript check
```

---

## 🚀 Deployment Structure

### Local Development
```
PostgreSQL (Docker)
    ↓
Prisma (ORM)
    ↓
Express API (localhost:3001)
    ↓
Next.js Frontend (localhost:3000)
```

### Production (Docker Compose)
```
Docker Network
├── postgres container
├── redis container
├── api container (Express)
└── web container (Next.js)
```

---

## 📚 How to Navigate

### "I want to understand the project architecture"
→ Start with [START_HERE.md](./START_HERE.md) → [RIEPILOGO.md](./RIEPILOGO.md)

### "I want to get started locally"
→ Start with [QUICKSTART.md](./QUICKSTART.md)

### "I want to know what's implemented"
→ Start with [✅_COMPLETAMENTO.md](./✅_COMPLETAMENTO.md)

### "I want to see the full timeline"
→ Start with [🗓️_TIMELINE.md](./🗓️_TIMELINE.md)

### "I need technical details"
→ Start with [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

### "I'm lost and need orientation"
→ Start with [📖_INDICE.md](./📖_INDICE.md)

---

**Generated:** 18 Gennaio 2026  
**Phase:** 1/4 Complete ✅
