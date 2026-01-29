/**
 * Database Connection Test
 * Verifica se la connessione al database funziona
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET'}`);
    
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL environment variable is not set!');
      process.exit(1);
    }

    // Test connection
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('✅ Database connection successful!');

    // Count users
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@eqb.it' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    if (admin) {
      console.log(`✅ Admin user found: ${admin.email}`);
    } else {
      console.error('❌ Admin user NOT found!');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
