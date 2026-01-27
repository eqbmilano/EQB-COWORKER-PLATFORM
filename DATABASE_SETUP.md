# 🚀 Configurare il Database PostgreSQL

## 3 Opzioni Rapide

### ✅ **Opzione 1: Neon (Consigliato - FREE & INSTANT)**

1. **Vai su:** https://neon.tech/
2. **Crea account** (usalo per login rapido con GitHub)
3. **Crea nuovo progetto**
4. **Copia la connection string** che troverai qui:
   ```
   postgresql://user:password@host:5432/neon
   ```
5. **Incolla in** `apps/api/.env.local`:
   ```env
   DATABASE_URL="[INCOLLA QUI LA CONNECTION STRING]"
   ```
6. **Salva file**
7. **Da terminal:**
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   ```

**Tempo:** 2-3 minuti ⏱️

---

### 🐳 **Opzione 2: Docker Local (Se Docker Desktop è avviato)**

```bash
# Start PostgreSQL container
docker run -d --name eqb-postgres \
  -e POSTGRES_USER=eqbuser \
  -e POSTGRES_PASSWORD=eqbpass \
  -e POSTGRES_DB=eqb_platform \
  -p 5432:5432 \
  postgres:15-alpine

# Update .env.local
DATABASE_URL="postgresql://eqbuser:eqbpass@localhost:5432/eqb_platform"

# Run migrations
cd apps/api
npx prisma migrate dev --name init
```

---

### 🖥️ **Opzione 3: PostgreSQL Locale Installato**

Se hai PostgreSQL installato localmente:

```bash
# Create database
createdb -U postgres eqb_platform

# Or via psql
psql -U postgres
CREATE DATABASE eqb_platform;
\q

# Update .env.local
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/eqb_platform"

# Run migrations
cd apps/api
npx prisma migrate dev --name init
```

---

## ✅ Dopo Configurazione Database

```bash
# 1. Generate Prisma client
cd apps/api
npx prisma generate

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Create admin user
npx tsx ../../scripts/create-admin.ts

# 4. Restart dev server
cd ../..
npm run dev

# 5. Login to http://localhost:5400
# Email: admin@eqbmilano.it
# Password: Admin@EQB2026!Secure
```

---

## 🔍 Verificare Connessione Database

```bash
# Test Prisma connection
cd apps/api
npx prisma db execute --stdin < /dev/null

# Or open Prisma Studio (visual DB manager)
npx prisma studio
```

---

## 📝 Quick Links

- **Neon.tech:** https://neon.tech/
- **Railway.app:** https://railway.app/
- **Render.com:** https://render.com/
- **PlanetScale:** https://planetscale.com/

Tutti offrono free tier con PostgreSQL!

