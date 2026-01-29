/**
 * Update Admin Password in Render PostgreSQL Database
 */
import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform',
  ssl: { rejectUnauthorized: false }
});

async function updatePassword() {
  try {
    await client.connect();
    console.log('✅ Connesso al database');

    const newHash = '$2b$10$nU3uLAyuEcMaW061Q1ipd.cQZmjMncEwCsF3E362WY3qQkfYHp76S';
    
    // Aggiorna la password
    await client.query(
      'UPDATE "User" SET "password" = $1 WHERE "email" = $2',
      [newHash, 'admin@eqb.it']
    );
    console.log('✅ Password aggiornata');

    // Verifica
    const result = await client.query(
      'SELECT "email", "password" FROM "User" WHERE "email" = $1',
      ['admin@eqb.it']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin user trovato:');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password hash: ${result.rows[0].password.substring(0, 20)}...`);
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await client.end();
  }
}

updatePassword();
