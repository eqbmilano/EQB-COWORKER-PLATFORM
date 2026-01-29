/**
 * Generate BCrypt Hash for Admin Password
 */
import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'AdminEQB2026!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUsa questo hash nel SQL INSERT:');
  console.log(`'${hash}'`);
}

generateHash();
