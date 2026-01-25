/**
 * Seed Admin User Script
 * Creates test admin user for development and testing
 * 
 * Usage:
 * Local: npx ts-node scripts/seedAdmin.ts
 * Render: Add to migration or manual SQL execution
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdminUser() {
  const adminEmail = 'admin@eqb.it';
  const adminPassword = 'AdminEQB2026!';
  
  try {
    console.log('\n🌱 Seeding admin user...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'EQB',
        role: 'ADMIN',
      },
      create: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'EQB',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Admin user seeded successfully!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('🆔 User ID:', adminUser.id);
    console.log('👤 Role:', adminUser.role);
    console.log('\n💡 Use these credentials to login on the platform.\n');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedAdminUser();
}

export default seedAdminUser;
