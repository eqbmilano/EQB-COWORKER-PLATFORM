/**
 * Prisma seed script for initial data
 * Run with: npm run db:seed
 */
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, addHours, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Seeding database...\n');

  // Clear existing data (optional - comment out to preserve data)
  console.log('🗑️  Clearing existing data...');
  await prisma.appointmentInvoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.coworker.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  // Passwords
  const adminPassword = await bcrypt.hash('AdminEQB2026!', 10);
  const coworkerPassword = await bcrypt.hash('CoworkerEQB2026!', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eqb.it',
      firstName: 'Admin',
      lastName: 'EQB',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: 'ACTIVE',
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
      email: 'coworker@eqb.it',
      firstName: 'Marco',
      lastName: 'Rossi',
      password: coworkerPassword,
      role: UserRole.COWORKER,
      status: 'ACTIVE',
      coworkerProfile: {
        create: {
          profession: 'Fisioterapista',
          specialization: 'Riabilitazione sportiva',
          bio: 'Fisioterapista specializzato in riabilitazione sportiva con 10 anni di esperienza',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log('✅ Coworker created:', coworker.email);

  // Create sample clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Marco Bianchi',
      email: 'marco.bianchi@example.com',
      phone: '+39 338 123 4567',
      companyName: 'Studio Bianchi',
      city: 'Milano',
      address: 'Via Roma 15',
      zipCode: '20121',
      notes: 'Cliente VIP - preferisce appuntamenti mattutini',
      status: 'ACTIVE',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Laura Verdi',
      email: 'laura.verdi@example.com',
      phone: '+39 349 987 6543',
      city: 'Milano',
      address: 'Corso Buenos Aires 42',
      zipCode: '20124',
      status: 'ACTIVE',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Giuseppe Neri',
      email: 'giuseppe.neri@example.com',
      phone: '+39 340 555 1234',
      companyName: 'Neri Personal Training',
      city: 'Milano',
      address: 'Via Tortona 31',
      zipCode: '20144',
      notes: 'Richiede fattura elettronica',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Clients created:', client1.name, client2.name, client3.name);

  // Create appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointment1 = await prisma.appointment.create({
    data: {
      userId: coworker.id,
      clientId: client1.id,
      startTime: addHours(today, 10),
      endTime: addHours(today, 11),
      durationHours: 1,
      type: 'Seduta fisioterapica',
      roomType: 'TREATMENT',
      roomNumber: 'T1',
      status: 'SCHEDULED',
      notes: 'Prima seduta - valutazione iniziale',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      userId: coworker.id,
      clientId: client2.id,
      startTime: subDays(addHours(today, 14), 3),
      endTime: subDays(addHours(today, 15), 3),
      durationHours: 1,
      type: 'Allenamento personalizzato',
      roomType: 'TRAINING',
      roomNumber: 'A2',
      status: 'COMPLETED',
      notes: 'Sessione completata',
    },
  });

  const appointment3 = await prisma.appointment.create({
    data: {
      userId: coworker.id,
      clientId: client3.id,
      startTime: addDays(addHours(today, 16), 2),
      endTime: addDays(addHours(today, 17.5), 2),
      durationHours: 1.5,
      type: 'Consulenza nutrizionale',
      roomType: 'TREATMENT',
      roomNumber: 'T2',
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Appointments created:', appointment1.id, appointment2.id, appointment3.id);

  // Create invoices
  const invoice1 = await prisma.appointmentInvoice.create({
    data: {
      appointmentId: appointment2.id,
      amount: 60.00,
      currency: 'EUR',
      issueDate: subDays(today, 3),
      dueDate: addDays(subDays(today, 3), 30),
      status: 'PAID',
      notes: 'Pagamento ricevuto il ' + subDays(today, 1).toLocaleDateString('it-IT'),
    },
  });

  const invoice2 = await prisma.appointmentInvoice.create({
    data: {
      appointmentId: appointment1.id,
      amount: 80.00,
      currency: 'EUR',
      issueDate: today,
      dueDate: addDays(today, 15),
      status: 'SENT',
      notes: 'Fattura inviata via email',
    },
  });

  console.log('✅ Invoices created:', invoice1.id, invoice2.id);

  console.log('\n✅ Database seeded successfully!\n');
  console.log('👤 Admin: admin@eqb.it / AdminEQB2026!');
  console.log('👤 Coworker: coworker@eqb.it / CoworkerEQB2026!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
