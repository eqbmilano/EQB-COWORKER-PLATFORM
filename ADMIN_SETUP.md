# 🔐 EQB Platform - Default Admin Setup

## Default Admin Credentials

### Email & Password
```
📧 Email:    admin@eqbmilano.it
🔑 Password: Admin@EQB2026!Secure
```

### User Details
```
👤 Name:     Amministratore EQB Platform
🎯 Role:     ADMIN
📊 Permissions: 
   - manage_users
   - manage_appointments
   - manage_invoices
   - view_analytics
```

---

## ⚠️ Important Security Notes

1. **Change Password Immediately**
   - Login with default credentials
   - Go to Profile → Change Password
   - Set a secure password (min 12 characters, mixed case, numbers, symbols)

2. **Environment Setup Required**
   Before creating admin user, ensure your `.env.local` is configured:
   
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/eqb_platform"
   API_PORT=5401
   NODE_ENV=development
   JWT_SECRET="your-super-secret-key-change-this-in-production"
   WEB_ALLOWED_ORIGINS="http://localhost:5400"
   ```

3. **Database Connection**
   - PostgreSQL must be running
   - Database must exist and be accessible
   - Run migrations before creating admin

---

## 🚀 Setup Steps

### Step 1: Configure Environment
```bash
# Edit apps/api/.env.local with your database connection
DATABASE_URL="postgresql://user:password@localhost:5432/eqb_platform"
```

### Step 2: Setup Database
```bash
# Generate Prisma client
cd apps/api
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or for development (creates migrations)
npx prisma migrate dev
```

### Step 3: Create Admin User
```bash
# From root directory
npm run create:admin

# Or manually with Prisma Studio
npx prisma studio
# Then manually create user with:
# email: admin@eqbmilano.it
# password: Admin@EQB2026!Secure (hashed with bcrypt)
# role: ADMIN
```

### Step 4: Start Application
```bash
npm run dev
# Web: http://localhost:5400
# API: http://localhost:5401
```

### Step 5: Login
1. Navigate to http://localhost:5400/login
2. Enter email: `admin@eqbmilano.it`
3. Enter password: `Admin@EQB2026!Secure`
4. Click "Accedi"

### Step 6: Change Password
1. After login, go to Profile (top right menu)
2. Click "Change Password"
3. Enter current password: `Admin@EQB2026!Secure`
4. Enter new secure password (repeat)
5. Click "Update Password"

---

## 📝 Creating Additional Admins

### Via API (requires JWT token)
```bash
curl -X POST http://localhost:5401/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "another-admin@eqbmilano.it",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "Name",
    "role": "ADMIN"
  }'
```

### Via Prisma Studio (Development Only)
```bash
npm run prisma:studio
# Visual database manager opens at http://localhost:5555
# Navigate to User table
# Click Add record
# Fill in details and set role to ADMIN
```

### Via Direct Script
Edit and run `scripts/create-admin.ts` with different parameters

---

## 🔒 Password Security

### Requirements for All Users
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Recommended: Special characters (!@#$%^&*)

### Default Admin Password
- Is temporary and must be changed
- Never share credentials in code or documentation
- Use strong, unique passwords for production

---

## 🛡️ First Time Setup Checklist

- [ ] Database configured and running
- [ ] Environment variables set (.env.local)
- [ ] Migrations applied to database
- [ ] Admin user created
- [ ] Application started successfully
- [ ] Able to login with admin credentials
- [ ] Able to access dashboard
- [ ] Admin password changed to secure value
- [ ] Additional admins created as needed
- [ ] User access roles configured

---

## 🔄 Account Recovery

If you forget the admin password:

### Development (Local Database)
```bash
# Option 1: Reset and recreate admin
npm run prisma:migrate:reset
npm run create:admin

# Option 2: Use Prisma Studio to update password
npm run prisma:studio
# Find user, update password field (must be bcrypt hashed)
```

### Production
Contact your database administrator or:
1. Reset PostgreSQL user password
2. Run migration to update admin user
3. Use `bcrypt` to hash new password before storing

---

## 📞 Support

For issues during setup:
1. Check DATABASE_URL is correct and database exists
2. Verify migrations have run: `npx prisma migrate status`
3. Check logs in terminal for specific error messages
4. Review [README.md](../README.md) section "Getting Started"

---

**Last Updated:** 26 Gennaio 2026  
**Version:** 1.0.0
