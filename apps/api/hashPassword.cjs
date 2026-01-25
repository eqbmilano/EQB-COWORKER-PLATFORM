// Quick password hash generator
const bcrypt = require('bcrypt');

const password = 'AdminEQB2026!';
bcrypt.hash(password, 10).then(hash => {
  console.log('\nPassword:', password);
  console.log('Hash:', hash);
  console.log('\nSQL Query:');
  console.log(`
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  'admin-test-001',
  'admin@eqb.it',
  '${hash}',
  'Admin',
  'EQB',
  'ADMIN',
  NOW(),
  NOW()
);
  `);
});
