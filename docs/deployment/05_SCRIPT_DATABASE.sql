-- ============================================================
-- SCRIPT SQL COMPLETO PER RENDER POSTGRES
-- Esegui questo script nel SQL Editor di Render
-- ============================================================

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'COWORKER',
    "auth0Id" TEXT UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex User
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateTable Coworker
CREATE TABLE "Coworker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "bio" TEXT,
    "specializations" TEXT,
    "profileImageUrl" TEXT,
    "iban" TEXT,
    "taxId" TEXT,
    "companyName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasRestriction" BOOLEAN NOT NULL DEFAULT false,
    "restrictionReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex Coworker
CREATE INDEX "Coworker_isActive_idx" ON "Coworker"("isActive");
CREATE INDEX "Coworker_hasRestriction_idx" ON "Coworker"("hasRestriction");

-- CreateTable Admin
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "permissions" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Client
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "birthDate" TIMESTAMP,
    "medicalHistory" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex Client
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateTable CoworkerClient
CREATE TABLE "CoworkerClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coworkerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coworkerId") REFERENCES "Coworker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE ("coworkerId", "clientId")
);

-- CreateIndex CoworkerClient
CREATE INDEX "CoworkerClient_clientId_idx" ON "CoworkerClient"("clientId");

-- CreateTable ClientDocument
CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex ClientDocument
CREATE INDEX "ClientDocument_clientId_idx" ON "ClientDocument"("clientId");

-- CreateTable Appointment
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coworkerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "cancelledAt" TIMESTAMP,
    "cancelledBy" TEXT,
    "roomType" TEXT NOT NULL,
    "roomNumber" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coworkerId") REFERENCES "Coworker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex Appointment
CREATE INDEX "Appointment_coworkerId_idx" ON "Appointment"("coworkerId");
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateTable ModificationRequest
CREATE TABLE "ModificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "coworkerId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "newStartTime" TIMESTAMP,
    "newEndTime" TIMESTAMP,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("coworkerId") REFERENCES "Coworker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("requestedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("approvedBy") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex ModificationRequest
CREATE INDEX "ModificationRequest_status_idx" ON "ModificationRequest"("status");
CREATE INDEX "ModificationRequest_coworkerId_idx" ON "ModificationRequest"("coworkerId");

-- CreateTable BacklogEntry
CREATE TABLE "BacklogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL UNIQUE,
    "coworkerId" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "roomType" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "dayWorked" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("coworkerId") REFERENCES "Coworker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex BacklogEntry
CREATE INDEX "BacklogEntry_coworkerId_year_month_idx" ON "BacklogEntry"("coworkerId", "year", "month");
CREATE INDEX "BacklogEntry_status_idx" ON "BacklogEntry"("status");

-- CreateTable MonthlyRecap
CREATE TABLE "MonthlyRecap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coworkerId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "trainingHours" DOUBLE PRECISION NOT NULL,
    "treatmentHours" DOUBLE PRECISION NOT NULL,
    "appointmentCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "confirmedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coworkerId") REFERENCES "Coworker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE ("coworkerId", "year", "month")
);

-- CreateIndex MonthlyRecap
CREATE INDEX "MonthlyRecap_status_idx" ON "MonthlyRecap"("status");

-- CreateTable Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coworkerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "pdfUrl" TEXT,
    "backlogAttachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "sentAt" TIMESTAMP,
    "receivedAt" TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paymentEvidence" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("coworkerId", "year", "month")
);

-- CreateIndex Invoice
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

-- CreateTable AppointmentInvoice
CREATE TABLE "AppointmentInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL UNIQUE,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "issueDate" TIMESTAMP NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex AppointmentInvoice
CREATE INDEX "AppointmentInvoice_appointmentId_idx" ON "AppointmentInvoice"("appointmentId");
CREATE INDEX "AppointmentInvoice_status_idx" ON "AppointmentInvoice"("status");
CREATE INDEX "AppointmentInvoice_dueDate_idx" ON "AppointmentInvoice"("dueDate");

-- CreateTable BookingRestriction
CREATE TABLE "BookingRestriction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coworkerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coworkerId") REFERENCES "Coworker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex BookingRestriction
CREATE INDEX "BookingRestriction_coworkerId_idx" ON "BookingRestriction"("coworkerId");
CREATE INDEX "BookingRestriction_isActive_idx" ON "BookingRestriction"("isActive");

-- CreateTable Communication
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetRole" TEXT,
    "sendToAll" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex Communication
CREATE INDEX "Communication_type_idx" ON "Communication"("type");
CREATE INDEX "Communication_isPublished_idx" ON "Communication"("isPublished");

-- CreateTable CommunicationRead
CREATE TABLE "CommunicationRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communicationId" TEXT NOT NULL,
    "readBy" TEXT NOT NULL,
    "readAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("communicationId") REFERENCES "Communication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE ("communicationId", "readBy")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex AuditLog
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateTable CapacitySnapshot
CREATE TABLE "CapacitySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAvailableHours" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "totalUsedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utilisationPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trainingUsedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "treatmentUsedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeCoworkers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("year", "month")
);

-- ============================================================
-- STEP 2: CREA ADMIN USER
-- ============================================================
-- Password hashata per: AdminEQB2026!
INSERT INTO "User" (
    "id", "email", "password", "firstName", "lastName",
    "role", "status", "createdAt", "updatedAt"
) VALUES (
    'admin-001',
    'admin@eqb.it',
    '$2b$10$KIXSvZWpN.yI9qE5yLZ0eOQR5Z6vF0K7mH.LkXQZ8xN1qE5yLZ0eO',
    'Admin',
    'EQB',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
);

-- Crea record Admin associato
INSERT INTO "Admin" (
    "id", "userId", "permissions", "createdAt", "updatedAt"
) VALUES (
    'admin-001-record',
    'admin-001',
    'all',
    NOW(),
    NOW()
);

-- ============================================================
-- VERIFICA
-- ============================================================
-- Esegui questa query per verificare che tutto funziona:
-- SELECT email, role, status FROM "User" WHERE email = 'admin@eqb.it';

-- Dovrebbe tornare: admin@eqb.it | ADMIN | ACTIVE
