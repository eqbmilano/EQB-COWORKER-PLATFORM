#  EQB Platform - Appointment & Invoice Management System

**Status:**  **Phase 1 COMPLETED** | Fully Functional Production Build  
**Version:** 1.0.0 | **Last Updated:** 26 Gennaio 2026

>  **Platform Ready for Production** - Complete appointment, client, and invoice management system with advanced authorization workflow

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Default Admin Credentials](#default-admin-credentials)
- [Technical Stack](#technical-stack)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)

---

##  Overview

**EQB Platform** is a comprehensive appointment and invoice management system designed for professional services (training, medical treatments, consulting). It provides:

-  Advanced appointment scheduling with capacity planning
-  Client management with detailed profiles
-  Automated invoicing system
-  Role-based access control (ADMIN, COWORKER)
-  Backlog tracking and monthly recaps
-  Modification request authorization workflow
-  Audit logging and compliance tracking
-  Communication & notification system

---

##  Complete Feature List

###  Authentication & Authorization
-  Custom JWT authentication (no third-party dependency)
-  Email + password registration & login
-  Password hashing with bcrypt (salted)
-  7-day JWT token expiration (configurable)
-  Password change with validation
-  Role-based access control (ADMIN, COWORKER, GUEST)
-  Profile management (edit name, email, password)
-  Google OAuth backend endpoint (frontend setup required)
-  Session management with localStorage

###  Appointment Management
-  Create, read, update, delete appointments
-  Appointment scheduling with specific date/time
-  Duration tracking (hours calculation)
-  Client assignment to appointments
-  Coworker/staff assignment
-  Room type selection (Training/Treatment)
-  Status tracking:
  - SCHEDULED - Upcoming appointment
  - COMPLETED - Finished appointment
  - CANCELLED - Cancelled appointment
  - MODIFIED - Modified after creation
-  Date range filtering & search
-  Appointment notes & details storage
-  Calendar view (month grid with appointment indicators)
-  Appointment counter per day

###  Client Management
-  Create, read, update, delete clients
-  Client profiles with extensive data:
  - Contact info (email, phone, address)
  - Company & location details
  - Medical history (allergies, medications)
  - Tax ID for invoicing
  - Birth date tracking
-  Client status management:
  - ACTIVE - Currently active client
  - INACTIVE - Temporarily inactive
  - ARCHIVED - Removed from active list
-  Client list with search & filtering
-  Responsive grid layout (1-3 columns)
-  Coworker-Client relationship mapping
-  Document storage for each client

###  Invoice Management
-  Create, read, update, delete invoices
-  Appointment-linked invoicing
-  Coworker payment invoices (monthly)
-  Invoice status tracking:
  - DRAFT - Not yet sent
  - SENT - Sent to recipient
  - PAID - Payment received
  - OVERDUE - Past due date
  - CANCELLED - Cancelled invoice
-  Payment status tracking:
  - PENDING - Not paid
  - PARTIAL - Partially paid
  - PAID - Fully paid
  - OVERDUE - Payment overdue
-  Amount & currency management
-  Invoice numbering (unique per period)
-  Due date tracking & reminders
-  Payment method & evidence tracking
-  PDF export capability (endpoint ready)
-  Invoice statistics & dashboard

###  Backlog & Capacity Management
-  Automatic backlog entry creation from appointments
-  Hours tracking (Training vs Treatment)
-  Monthly recap generation
-  Capacity snapshots (max 1500 hours/month per system)
-  Utilization percentage calculation
-  Backlog status workflow:
  - OPEN - Ready for confirmation
  - PENDING_CONFIRMATION - Awaiting review
  - CONFIRMED - Approved
  - CONTESTED - Disputed entries
-  Monthly recap status:
  - OPEN - New recap
  - REQUESTED - Submitted for approval
  - CONFIRMED - Approved by admin
  - CONTESTED - Disputed by coworker
  - APPROVED - Final approval

###  Modification Request Workflow
-  Request to reschedule appointments
-  Request to cancel with change
-  Request to extend appointments
-  Authorization status tracking:
  - PENDING - Awaiting admin review
  - APPROVED - Admin approved
  - REJECTED - Admin rejected
-  Admin approval/rejection with notes
-  Audit trail of all modifications

###  Restrictions & Blocking
-  Booking restrictions (time-based blackouts)
-  Coworker availability management
-  Restriction reason tracking
-  Date range blocking
-  Automatic restriction validation during booking

###  User Management
-  Admin user creation
-  Coworker profile management
-  User status management (ACTIVE, INACTIVE, BLOCKED)
-  Role assignment (ADMIN, COWORKER)
-  Specialization tracking for coworkers
-  Financial info storage (IBAN, tax ID, company)
-  Restriction management per coworker

###  Dashboard & Analytics
-  Administrative dashboard
-  Backlog statistics
-  Monthly recap list
-  Operator statistics & performance
-  Invoice overview with totals
-  Appointment statistics

###  Communications
-  System announcements
-  Alert notifications
-  Reminders & updates
-  Targeted messaging (by role)
-  Read/unread tracking
-  Attachment support

###  Audit & Logging
-  Complete audit trail
-  Action logging (create, update, delete)
-  Entity tracking
-  Change history (JSON diff)
-  IP address & user agent tracking
-  Compliance ready

###  UI/UX Features
-  Dark theme with professional gradient
-  Glass morphism design (backdrop-blur, white/20 opacity)
-  Responsive sidebar navigation
-  Mobile hamburger menu
-  Lucide React icons throughout
-  Form validation with error display
-  Loading states & skeletons
-  Toast notifications (react-hot-toast)
-  Date formatting in Italian locale
-  Accessibility features (ARIA labels, semantic HTML)
-  Animation & transitions

---

##  Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL 14+ (local or cloud)
- npm or yarn

### Environment Setup

#### 1. Clone Repository & Install Dependencies
```bash
cd "c:\Users\luana\Desktop\AI AGENCY\00 PROGETTI\EQB PIATTAFORMA"
npm install
```

#### 2. Configure Environment Variables

**Backend** (`apps/api/.env.local`):
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eqb_platform"

# Server
API_PORT=5401
NODE_ENV=development

# Authentication
JWT_SECRET="your-secret-key-minimum-32-characters-long"

# CORS
WEB_ALLOWED_ORIGINS="http://localhost:5400,https://your-domain.com"

# Email (SendGrid) - Optional
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
FROM_EMAIL="noreply@eqbmilano.it"
FROM_NAME="EQB Platform"

# Redis (Bull queues) - Optional
REDIS_URL="redis://default:password@localhost:6379"
```

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5401
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### 3. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Create admin user
npm run create:admin
```

#### 4. Start Development Server
```bash
npm run dev
```

The application will be available at:
- **Web:** http://localhost:5400
- **API:** http://localhost:5401

---

##  Default Admin Credentials

### Automatic Creation
Run this to create the default admin user:
```bash
npm run create:admin
```

### Credentials
```
📧 Email:    admin@eqb.it
🔐 Password: AdminEQB2026!
👤 Name:     Admin EQB
🎯 Role:     ADMIN
```

** IMPORTANT:** Change the password on first login!

### Create Additional Admins
```bash
npm run prisma:studio
# or manually via API:
curl -X POST http://localhost:5401/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "Name"
  }'
```

---

##  Technical Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.35 | React framework with App Router |
| TypeScript | 5.x | Type safety |
| React | 18.2.0 | UI library |
| Tailwind CSS | 3.x | Utility-first styling |
| Zustand | 4.4.5 | State management |
| React Query | 5.x | Server state management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| Lucide React | 0.563 | Icon library |
| React Hot Toast | 2.6 | Notifications |
| FullCalendar | 6.x | Calendar component |
| Recharts | 2.x | Charts & graphs |
| date-fns | 4.x | Date utilities (Italian locale) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | Latest | HTTP server |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM for PostgreSQL |
| PostgreSQL | 14+ | Primary database |
| JWT | Custom | Authentication |
| bcrypt | Latest | Password hashing |
| Pino | Latest | Structured logging |
| Zod | 3.x | Schema validation |
| CORS | Latest | Cross-origin support |
| Dotenv | Latest | Environment variables |
| Bull | Latest | Job queue (optional Redis) |
| SendGrid | Latest | Email service (optional) |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Turbo | Monorepo orchestration |
| Docker | Containerization ready |
| Docker Compose | Local development environment |
| npm | Package management |
| TypeScript | Type checking |
| ESLint | Code linting |
| Prettier | Code formatting |

---

##  Architecture

### Monorepo Structure
```
apps/
 api/                    # Express backend (port 5401)
    src/
       controllers/   # Route handlers
       routes/        # API endpoints
       services/      # Business logic
       middleware/    # Auth, validation, logging
       validators/    # Zod schemas
       jobs/          # Scheduled tasks
       database/      # Prisma client
       utils/         # Helpers
    prisma/
       schema.prisma  # Database schema
       migrations/    # Database versions
    server.ts          # Entry point

 web/                    # Next.js frontend (port 5400)
     src/
        app/           # Next.js 14 App Router
        components/    # React components
        hooks/         # Custom React hooks
        lib/           # Utilities
        store/         # Zustand stores
        types/         # TypeScript types
        styles/        # Global styles
     public/            # Static assets

packages/
 shared-types/          # Shared TypeScript types
 ui-components/         # Reusable UI components
```

### Data Flow
```
Browser (Next.js)
    
React Components & Hooks
    
Zustand State Store
    
React Query / Fetch API
    
Express API Server
    
Validation (Zod)
    
Business Logic (Services)
    
Prisma ORM
    
PostgreSQL Database
```

---

##  API Documentation

### Base URL
```
http://localhost:5401/api
```

### Authentication Routes
```
POST   /auth/register           # Create new user
POST   /auth/login              # Login & get JWT
POST   /auth/refresh            # Refresh token
GET    /auth/profile            # Get current user
PUT    /auth/profile            # Update profile
POST   /auth/change-password    # Change password
```

### Appointment Routes
```
GET    /appointments            # List all appointments
GET    /appointments/:id        # Get appointment details
POST   /appointments            # Create appointment
PUT    /appointments/:id        # Update appointment
DELETE /appointments/:id        # Cancel appointment
```

### Client Routes
```
GET    /clients                 # List all clients
GET    /clients/:id             # Get client details
POST   /clients                 # Create client
PUT    /clients/:id             # Update client
DELETE /clients/:id             # Delete client
```

### Invoice Routes
```
GET    /invoices                # List invoices
GET    /invoices/:id            # Get invoice details
POST   /invoices                # Create invoice
PUT    /invoices/:id            # Update invoice
DELETE /invoices/:id            # Cancel invoice
GET    /invoices/:id/pdf        # Export PDF
```

### Admin Routes
```
GET    /admin/dashboard         # Admin statistics
GET    /admin/users             # List users
PUT    /admin/users/:id/role    # Update user role
POST   /admin/users/:id/block   # Block user
```

### Backlog Routes
```
GET    /backlog                 # List backlog entries
GET    /backlog/monthly         # Monthly recaps
POST   /backlog/confirm         # Confirm entries
```

---

##  Database Schema

### Core Models

#### User
```typescript
model User {
  id: String (UUID)
  email: String (unique)
  password: String (bcrypt hashed)
  firstName: String?
  lastName: String?
  role: UserRole (ADMIN, COWORKER)
  status: UserStatus (ACTIVE, INACTIVE, BLOCKED)
  auth0Id: String? (legacy OAuth)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Appointment
```typescript
model Appointment {
  id: String (UUID)
  coworkerId: String (foreign key)
  clientId: String (foreign key)
  userId: String (creator)
  startTime: DateTime
  endTime: DateTime
  durationHours: Float
  type: String (Training, Treatment, etc.)
  status: AppointmentStatus
  roomType: String
  roomNumber: Int?
  notes: String?
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Client
```typescript
model Client {
  id: String (UUID)
  email: String (unique)
  name: String
  phone: String?
  taxId: String?
  address: String?
  city: String?
  medicalHistory: String?
  allergies: String?
  medications: String?
  status: ClientStatus
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Invoice
```typescript
model Invoice {
  id: String (UUID)
  userId: String (coworker)
  month: Int (1-12)
  year: Int (2026, etc)
  totalAmount: Float
  currency: String (default: EUR)
  hoursWorked: Float
  hourlyRate: Float
  status: InvoiceStatus
  paymentStatus: PaymentStatus
  invoiceNumber: String (unique)
  pdfUrl: String?
  sentAt: DateTime?
  paymentDate: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### ModificationRequest
```typescript
model ModificationRequest {
  id: String (UUID)
  appointmentId: String
  coworkerId: String
  requestedBy: String
  requestType: ModificationType (RESCHEDULE, CANCEL_WITH_CHANGE, EXTEND)
  newStartTime: DateTime?
  newEndTime: DateTime?
  reason: String
  status: AuthorizationStatus (PENDING, APPROVED, REJECTED)
  approvedBy: String?
  rejectionReason: String?
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### BacklogEntry
```typescript
model BacklogEntry {
  id: String (UUID)
  appointmentId: String
  coworkerId: String
  hoursWorked: Float
  roomType: String (Training, Treatment)
  month: Int
  year: Int
  dayWorked: Int
  status: BacklogStatus
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### MonthlyRecap
```typescript
model MonthlyRecap {
  id: String (UUID)
  coworkerId: String
  month: Int
  year: Int
  totalHours: Float
  trainingHours: Float
  treatmentHours: Float
  appointmentCount: Int
  status: RecapStatus
  confirmedAt: DateTime?
  rejectionReason: String?
  createdAt: DateTime
  updatedAt: DateTime
}
```

See [Prisma Schema](apps/api/prisma/schema.prisma) for complete database structure.

---

##  Development

### Available Scripts

#### Root Commands
```bash
npm run dev              # Start dev server (web + API)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run create:admin     # Create default admin user
```

#### Backend Commands
```bash
cd apps/api
npm run dev              # Start API dev server
npm run build            # Build API
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (visual DB manager)
npm run seed             # Seed database
```

#### Frontend Commands
```bash
cd apps/web
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test             # Run tests
```

### Database Management

#### Migrations
```bash
# Create migration after schema changes
npm run prisma:migrate -- --name add_new_field

# View migration status
npm run prisma:migrate:status

# Reset database ( deletes all data)
npm run prisma:migrate:reset
```

#### Prisma Studio
```bash
npm run prisma:studio
# Opens web interface at http://localhost:5555
# Visual database manager & query builder
```

### Code Quality
```bash
npm run lint             # Check code style
npm run format           # Auto-format code
npm run type-check       # Check TypeScript types
npm run test             # Run test suite
```

---

##  Key Features Deep Dive

### Appointment Workflow
1. Admin/Coworker creates appointment with date/time/client/room
2. System validates coworker availability & room conflicts
3. Appointment stored with SCHEDULED status
4. Automatic backlog entry created
5. Client can be invoiced separately (AppointmentInvoice)
6. On completion, status changed to COMPLETED
7. Can request modifications (reschedule, extend, cancel)
8. Modifications require admin approval

### Invoice Generation
1. Monthly invoice created for coworkers based on hours
2. Appointment-level invoices created for clients
3. Invoice number auto-generated (format: INV-2026-001)
4. Status workflow: DRAFT  SENT  PAID
5. Payment tracking with evidence upload
6. PDF export for printing/emailing
7. Past due tracking with OVERDUE status

### Authorization Workflow
```
Coworker requests modification
         
Request created (status: PENDING)
         
Admin reviews in dashboard
         
Admin approves or rejects
         
If approved: Appointment updated
If rejected: Reason stored, notification sent
```

### Backlog & Capacity
```
Appointment created  BacklogEntry auto-created
                   
        Backlog stays OPEN until month-end
                   
        Admin triggers monthly recap generation
                   
        MonthlyRecap created (OPEN status)
                   
        Coworker reviews & requests confirmation
                   
        Admin approves  status: CONFIRMED
        OR
        Coworker contests  status: CONTESTED
```

---

##  Security Features

-  **Password Security:** bcrypt hashing with salt
-  **JWT Authentication:** 7-day expiration, refresh tokens
-  **CORS Protection:** Configurable allowed origins
-  **SQL Injection:** Prisma parameterized queries
-  **CSRF Protection:** State validation in modification workflow
-  **Authorization:** Role-based access control on all endpoints
-  **Audit Logging:** Complete action trail with IP/user-agent
-  **Rate Limiting:** Ready for implementation
-  **Data Validation:** Zod schemas on all inputs
-  **HTTPS Ready:** TLS certificate support in production

---

##  Performance Considerations

- **Caching:** React Query with configurable stale times
- **Database Indexing:** Optimized Prisma schema with strategic indexes
- **Lazy Loading:** Next.js automatic code splitting
- **Image Optimization:** Next.js Image component
- **API Pagination:** Ready for implementation
- **Database Connection Pooling:** Via Prisma
- **CDN Ready:** Static assets optimized for CloudFlare/AWS

---

##  Deployment

### Vercel (Frontend)
```bash
npm run build
# Deploy apps/web to Vercel
# Set environment variables in Vercel dashboard
```

### Docker (Backend)
```bash
docker build -t eqb-api apps/api
docker run -p 5401:5401 --env-file .env eqb-api
```

### PostgreSQL Hosting
- **Recommended:** Railway.app, Render, Neon
- Connection string format: `postgresql://user:password@host:5432/eqb_platform`

---

##  Support & Contact

For issues or questions:
- **Email:** admin@eqbmilano.it
- **Documentation:** See [docs/](docs/) folder
- **Issues:** GitHub Issues

---

##  License

Proprietary - EQB Milano 2026. All rights reserved.

---

##  Version History

### v1.0.0 (26 Gennaio 2026)
-  Complete authentication system
-  Appointment management with calendar
-  Client database & profiles
-  Invoice generation & tracking
-  Backlog & monthly recaps
-  Modification request workflow
-  Admin dashboard & analytics
-  Audit logging & compliance
-  Communication system
-  Responsive UI with dark theme
-  Production-ready deployment

---

**Built with  by EQB Milano Development Team**  
*Last Updated: 26 Gennaio 2026 - v1.0.0*
