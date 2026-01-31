import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log('🔄 Checking database schema...');
    
    // Test query to see if columns exist
    try {
      await prisma.$queryRaw`SELECT "firstName", "lastName" FROM "User" LIMIT 1`;
      console.log('✅ Columns already exist!');
    } catch (error) {
      console.log('⚠️  Columns missing, attempting to add...');
      
      // Add firstName and lastName columns if they don't exist
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "firstName" TEXT,
        ADD COLUMN IF NOT EXISTS "lastName" TEXT
      `;
      
      console.log('✅ Columns added successfully!');
    }
    
    console.log('✅ Database schema check complete');
  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
