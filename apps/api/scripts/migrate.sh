#!/bin/bash
# Migration script to set up PostgreSQL database for EQB Platform

# Set environment
export DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/eqb_platform"}

echo "🚀 Running Prisma migrations..."
echo "📊 Database: $DATABASE_URL"

# Run migrations
npx prisma migrate deploy

# If migration create is needed (development only):
# npx prisma migrate dev --name add_appointment_invoices

echo "✅ Migrations completed!"

# Seed database with test data
echo ""
echo "🌱 Seeding database with test data..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo "📧 Admin: admin@eqb.it / AdminEQB2026!"
echo "👤 Coworker: coworker@eqb.it / CoworkerEQB2026!"
