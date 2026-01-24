/**
 * Prisma seed script for initial data
 * Run with: pnpm run db:seed
 */
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.user.deleteMany();

  // Shared demo password
  const demoPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eqb.it',
      name: 'Admin EQB',
      firstName: 'Admin',
      lastName: 'EQB',
      password: demoPassword,
      role: UserRole.ADMIN,
      auth0Id: 'auth0|admin',
      adminProfile: {
        create: {
          permissions: ['MANAGE_APPOINTMENTS', 'MANAGE_INVOICES', 'MANAGE_USERS'],
        },
      },
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample coworker
  const coworker = await prisma.user.create({
    data: {
      email: 'coworker1@eqb.it',
      name: 'Marco Rossi',
      firstName: 'Marco',
      lastName: 'Rossi',
      password: demoPassword,
      role: UserRole.COWORKER,
      auth0Id: 'auth0|coworker1',
      coworkerProfile: {
        create: {
          phone: '+39 123 456 7890',
          bio: 'Specialista in trattamenti wellness',
          specializations: ['Massaggio', 'Fisioterapia'],
          iban: 'IT60X0542811101000000123456',
          taxId: 'RSSMRC80A01H501Z',
          companyName: 'Wellness Services',
          isActive: true,
        },
      },
    },
  });

  console.log('✅ Coworker created:', coworker.email);

  // Create sample clients
  const client1 = await prisma.client.create({
    data: {
      email: 'client1@example.com',
      name: 'Giovanni Bianchi',
      phone: '+39 987 654 3210',
      city: 'Milano',
      status: 'ACTIVE',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      email: 'client2@example.com',
      name: 'Anna Verdi',
      phone: '+39 987 654 3211',
      city: 'Milano',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Clients created:', client1.email, client2.email);

  // Link coworker to clients
  await prisma.coworkerClient.create({
    data: {
      coworkerId: coworker.coworkerProfile!.id,
      clientId: client1.id,
      notes: 'Cliente regolare - sedute settimanali',
    },
  });

  await prisma.coworkerClient.create({
    data: {
      coworkerId: coworker.coworkerProfile!.id,
      clientId: client2.id,
    },
  });

  console.log('✅ Coworker-Client links created');

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
