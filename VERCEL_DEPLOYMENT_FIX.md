# 🚀 VERCEL DEPLOYMENT - QUICK FIX GUIDE

## ⚡ Problema Attuale
Build fallisce con: `next: command not found` quando npm esegue script dentro `apps/web`

## ✅ Soluzione Implementata
- Cambiato build script to use relative path: `../../node_modules/.bin/next build`
- Aggiunto `auth0-react` alle dipendenze di apps/web
- Semplificato vercel.json

## 📋 NEXT STEPS SU VERCEL DASHBOARD

### 1️⃣ Configura Root Directory (IMPORTANTE!)
```
Vai a: Vercel Dashboard → Project Settings → General
Imposta: Root Directory = "apps/web"
Salva
```

### 2️⃣ Aggiungi Environment Variables
```
Vai a: Vercel Dashboard → Settings → Environment Variables
Aggiungi per Production:

NEXT_PUBLIC_API_URL=https://eqb-coworker-platform.onrender.com
NEXT_PUBLIC_AUTH0_DOMAIN=dev-oqkdpdr4j5yoji2z.eu.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=o6TlmuKXdf0KJRdjz6LgiYWhJoKgiFNs
AUTH0_CLIENT_SECRET=<il-tuo-client-secret>
AUTH0_BASE_URL=https://<your-vercel-url>.vercel.app
AUTH0_AUDIENCE=https://eqb-coworker-platform.api
```

### 3️⃣ Trigghera Rebuild
```
Vai a: Deployments → Ultimi build
Click "Redeploy" sul commit più recente
```

## 🔧 PROBLEMI RESIDUI NON RISOLTI (TODO)

### Auth0 Frontend Integration (RICHIEDE IMPLEMENTAZIONE)
- Login/Signup pages hanno solo placeholder
- Serve implementare Auth0 SDK wrapper
- Serve connettere authStore con Auth0 provider

### JWT Token Management
- Serve logica per salvare JWT nel browser
- Serve middleware per inviare JWT nei calls API

### API Endpoints
- Backend `/auth/callback` esiste ma frontend non lo chiama
- Serve implementare proper OAuth2 flow

## 📖 Docs Consigliati
- https://auth0.com/docs/quickstart/spa/next
- https://github.com/auth0/auth0-react#getting-started

## 💾 Local Testing
```bash
# Copia .env.local.example a .env.local
cp apps/web/.env.local.example apps/web/.env.local

# Compila values di Auth0
# npm install
# npm run dev
```

---
**Nota:** Il build dovrebbe andare a buon fine ora. Se continua a fallire, controlla i log su Vercel.
