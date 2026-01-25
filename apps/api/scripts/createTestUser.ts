/**
 * Script to create test user with hashed password
 * Run: npx ts-node scripts/createTestUser.ts
 */
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@eqb.it';
  const password = 'AdminEQB2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('\n🔐 Creating test user...\n');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Hashed:', hashedPassword);
  console.log('\n');

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'EQB',
        role: 'ADMIN',
      },
    });

    console.log('✅ User created successfully!');
    console.log('User ID:', user.id);
    console.log('\nYou can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  User already exists!');
      console.log('\nYou can login with:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('❌ Error creating user:', error);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
