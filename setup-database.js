import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://eqb_user:HPv7bv1M10YuTE17tVZGf2jtzXLczPgv@dpg-d5ppp3juibrs73d6dh30-a.frankfurt-postgres.render.com/eqb_platform';

async function executeDatabaseSetup() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connessione al database...');
    await client.connect();
    console.log('✅ Connesso!');

    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'docs/deployment/05_SCRIPT_DATABASE.sql');
    console.log(`\n📖 Leggo file SQL: ${sqlPath}`);
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ File non trovato: ${sqlPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(`✅ File letto (${sqlContent.length} bytes)`);

    // Esegui il setup
    console.log('\n🚀 Esecuzione setup database...\n');
    await client.query(sqlContent);

    console.log('\n✅ SETUP COMPLETATO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ 24 Tables creati');
    console.log('✓ Indici creati');
    console.log('✓ Admin user creato: admin@eqb.it / AdminEQB2026!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    if (error.detail) console.error('Dettagli:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Disconnesso dal database');
  }
}

executeDatabaseSetup();
