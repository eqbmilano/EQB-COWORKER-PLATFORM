import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino();

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// Handle connection errors
prisma.$on('beforeDisconnect', () => {
  logger.info('Disconnecting from database');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
