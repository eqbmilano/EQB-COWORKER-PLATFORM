import { PrismaClient, Prisma, ClientStatus } from '@prisma/client';
import prisma from '../database/prisma.js';
import { logger } from '../utils/logger.js';

interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  coworkerId: string;
}

interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
}

interface ClientFilters {
  search?: string;
  coworkerId?: string;
  city?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export class ClientService {
  /**
   * Create a new client
   */
  async createClient(data: CreateClientInput) {
    try {
      logger.info('Creating new client', { data });

      // Check if coworker exists
      const coworker = await prisma.coworker.findUnique({
        where: { userId: data.coworkerId },
      });

      if (!coworker) {
        throw new Error('Coworker not found');
      }

      // Check for duplicate email
      if (data.email) {
        const existingByEmail = await prisma.client.findUnique({
          where: { email: data.email },
        });
        if (existingByEmail) {
          throw new Error('Client with this email already exists');
        }
      }

      // Create client and relationship in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create client
        const client = await tx.client.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            birthDate: data.birthDate,
            address: data.address,
            city: data.city,
            postalCode: data.postalCode,
            taxId: data.taxId,
            medicalHistory: data.medicalHistory,
            allergies: data.allergies,
            medications: data.medications,
            status: 'ACTIVE' as ClientStatus,
          },
        });

        // Create CoworkerClient relationship
        await tx.coworkerClient.create({
          data: {
            coworkerId: data.coworkerId,
            clientId: client.id,
          },
        });

        return client;
      });

      logger.info('Client created successfully', { clientId: result.id });
      return result;
    } catch (error) {
      logger.error('Failed to create client', { error });
      throw error;
    }
  }

  /**
   * Get client by ID with relationships
   */
  async getClientById(clientId: string, includeRelations = true) {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: includeRelations
          ? {
              coworkers: {
                include: {
                  coworker: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          email: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
              appointments: {
                where: {
                  status: {
                    in: ['SCHEDULED', 'COMPLETED'],
                  },
                },
                orderBy: {
                  startTime: 'desc',
                },
                take: 10,
                include: {
                  coworker: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
              documents: {
                orderBy: {
                  uploadedAt: 'desc',
                },
              },
            }
          : undefined,
      });

      if (!client) {
        throw new Error('Client not found');
      }

      return client;
    } catch (error) {
      logger.error('Failed to get client', { clientId, error });
      throw error;
    }
  }

  /**
   * Get all clients with filtering and pagination
   */
  async getClients(
    filters: ClientFilters = {},
    page = 1,
    limit = 20
  ) {
    try {
      const where: Prisma.ClientWhereInput = {
        status: 'ACTIVE',
      };

      // Search filter (name, email, phone)
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Filter by coworker
      if (filters.coworkerId) {
        where.coworkers = {
          some: {
            coworkerId: filters.coworkerId,
          },
        };
      }

      // Filter by city
      if (filters.city) {
        where.city = { contains: filters.city, mode: 'insensitive' };
      }

      // Filter by creation date
      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {};
        if (filters.createdAfter) {
          where.createdAt.gte = filters.createdAfter;
        }
        if (filters.createdBefore) {
          where.createdAt.lte = filters.createdBefore;
        }
      }

      // Execute query with pagination
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            coworkers: {
              include: {
                coworker: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                appointments: true,
                documents: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.client.count({ where }),
      ]);

      return {
        clients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get clients', { filters, error });
      throw error;
    }
  }

  /**
   * Get clients by coworker ID
   */
  async getCoworkerClients(coworkerId: string, page = 1, limit = 20) {
    return this.getClients({ coworkerId }, page, limit);
  }

  /**
   * Update client information
   */
  async updateClient(clientId: string, data: UpdateClientInput) {
    try {
      logger.info('Updating client', { clientId, data });

      // Check if client exists
      const existingClient = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!existingClient) {
        throw new Error('Client not found');
      }

      // Check for duplicate email (if changing)
      if (data.email && data.email !== existingClient.email) {
        const duplicateEmail = await prisma.client.findUnique({
          where: { email: data.email },
        });
        if (duplicateEmail) {
          throw new Error('Email already in use by another client');
        }
      }

      // Update client
      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data,
        include: {
          coworkers: {
            include: {
              coworker: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      logger.info('Client updated successfully', { clientId });
      return updatedClient;
    } catch (error) {
      logger.error('Failed to update client', { clientId, error });
      throw error;
    }
  }

  /**
   * Soft delete client (set status to INACTIVE)
   */
  async deleteClient(clientId: string) {
    try {
      logger.info('Deleting client', { clientId });

      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Soft delete by setting status to INACTIVE
      await prisma.client.update({
        where: { id: clientId },
        data: {
          status: 'INACTIVE',
        },
      });

      logger.info('Client deleted successfully', { clientId });
      return { message: 'Client deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete client', { clientId, error });
      throw error;
    }
  }

  /**
   * Add coworker to client
   */
  async addCoworkerToClient(clientId: string, coworkerId: string) {
    try {
      logger.info('Adding coworker to client', { clientId, coworkerId });

      // Check if relationship already exists
      const existing = await prisma.coworkerClient.findUnique({
        where: {
          coworkerId_clientId: {
            coworkerId,
            clientId,
          },
        },
      });

      if (existing) {
        throw new Error('Coworker is already associated with this client');
      }

      // Create relationship
      const relationship = await prisma.coworkerClient.create({
        data: {
          coworkerId,
          clientId,
        },
      });

      logger.info('Coworker added to client successfully', {
        clientId,
        coworkerId,
      });
      return relationship;
    } catch (error) {
      logger.error('Failed to add coworker to client', {
        clientId,
        coworkerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Remove coworker from client
   */
  async removeCoworkerFromClient(clientId: string, coworkerId: string) {
    try {
      logger.info('Removing coworker from client', { clientId, coworkerId });

      // Check if relationship exists
      const relationship = await prisma.coworkerClient.findUnique({
        where: {
          coworkerId_clientId: {
            coworkerId,
            clientId,
          },
        },
      });

      if (!relationship) {
        throw new Error('Coworker is not associated with this client');
      }

      // Delete relationship
      await prisma.coworkerClient.delete({
        where: {
          coworkerId_clientId: {
            coworkerId,
            clientId,
          },
        },
      });

      logger.info('Coworker removed from client successfully', {
        clientId,
        coworkerId,
      });
      return { message: 'Coworker removed successfully' };
    } catch (error) {
      logger.error('Failed to remove coworker from client', {
        clientId,
        coworkerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  async getClientStatistics(clientId: string) {
    try {
      const [
        totalAppointments,
        completedAppointments,
        totalHours,
        lastAppointment,
      ] = await Promise.all([
        // Total appointments
        prisma.appointment.count({
          where: {
            clientId,
            status: {
              in: ['SCHEDULED', 'COMPLETED'],
            },
          },
        }),
        // Completed appointments
        prisma.appointment.count({
          where: {
            clientId,
            status: 'COMPLETED',
          },
        }),
        // Total hours (sum of completed appointment durations)
        prisma.appointment.aggregate({
          where: {
            clientId,
            status: 'COMPLETED',
          },
          _sum: {
            durationHours: true,
          },
        }),
        // Last appointment
        prisma.appointment.findFirst({
          where: {
            clientId,
            status: {
              in: ['SCHEDULED', 'COMPLETED'],
            },
          },
          orderBy: {
            startTime: 'desc',
          },
        }),
      ]);

      return {
        totalAppointments,
        completedAppointments,
        totalHours: totalHours._sum.durationHours || 0,
        lastAppointmentDate: lastAppointment?.startTime || null,
      };
    } catch (error) {
      logger.error('Failed to get client statistics', { clientId, error });
      throw error;
    }
  }
}

export default new ClientService();

