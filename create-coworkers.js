/**
 * Create Test Coworker Users
 */
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform',
  ssl: { rejectUnauthorized: false }
});

const coworkers = [
  {
    id: 'coworker-001',
    email: 'marco.rossi@eqb.it',
    password: 'Marco2026!',
    firstName: 'Marco',
    lastName: 'Rossi',
    specializations: ['Fisioterapia sportiva', 'Riabilitazione'],
    phone: '+39 340 1234567'
  },
  {
    id: 'coworker-002',
    email: 'giulia.bianchi@eqb.it',
    password: 'Giulia2026!',
    firstName: 'Giulia',
    lastName: 'Bianchi',
    specializations: ['Massoterapia', 'Osteopatia'],
    phone: '+39 340 7654321'
  },
  {
    id: 'coworker-003',
    email: 'luca.verdi@eqb.it',
    password: 'Luca2026!',
    firstName: 'Luca',
    lastName: 'Verdi',
    specializations: ['Fisioterapia generale', 'Terapia manuale'],
    phone: '+39 340 9876543'
  }
];

async function createCoworkers() {
  try {
    await client.connect();
    console.log('✅ Connesso al database\n');

    for (const coworker of coworkers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(coworker.password, 10);

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM "User" WHERE email = $1',
        [coworker.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⚠️  Utente ${coworker.email} già esistente, skip...`);
        continue;
      }

      // Create User
      await client.query(
        `INSERT INTO "User" (
          "id", "email", "password", "firstName", "lastName",
          "role", "status", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          coworker.id,
          coworker.email,
          hashedPassword,
          coworker.firstName,
          coworker.lastName,
          'COWORKER',
          'ACTIVE'
        ]
      );

      // Create Coworker Profile
      await client.query(
        `INSERT INTO "Coworker" (
          "id", "userId", "specializations", "phone",
          "isActive", "hasRestriction", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          `${coworker.id}-profile`,
          coworker.id,
          JSON.stringify(coworker.specializations),
          coworker.phone,
          true,
          false
        ]
      );

      console.log(`✅ Creato coworker: ${coworker.firstName} ${coworker.lastName}`);
      console.log(`   Email: ${coworker.email}`);
      console.log(`   Password: ${coworker.password}`);
      console.log(`   Specializzazioni: ${coworker.specializations.join(', ')}\n`);
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ COWORKER CREATI CON SUCCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 CREDENZIALI DI ACCESSO:\n');
    coworkers.forEach((c, i) => {
      console.log(`${i + 1}. ${c.firstName} ${c.lastName}`);
      console.log(`   Email: ${c.email}`);
      console.log(`   Password: ${c.password}\n`);
    });

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await client.end();
  }
}

createCoworkers();
