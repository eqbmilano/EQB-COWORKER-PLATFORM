import { Router } from 'express';
import { z } from 'zod';
import clientService from '../services/clientService.js';
import prisma from '../database/client.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadToS3,
  deleteFromS3,
  handleUploadError,
  validateFilePresence,
} from '../middleware/upload.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Zod validation schemas
const CreateClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  taxCode: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateClientSchema = CreateClientSchema.partial();

const ClientQuerySchema = z.object({
  search: z.string().optional(),
  coworkerId: z.string().optional(),
  city: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * GET /clients
 * Get all clients with filtering
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = ClientQuerySchema.parse(req.query);
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;

    const filters = {
      search: query.search,
      coworkerId: query.coworkerId,
      city: query.city,
    };

    const result = await clientService.getClients(filters, page, limit);

    res.json({
      success: true,
      data: result.clients,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Failed to get clients', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve clients',
      message: error.message,
    });
  }
});

/**
 * GET /clients/coworker/:coworkerId
 * Get clients for a specific coworker
 */
router.get('/coworker/:coworkerId', authMiddleware, async (req, res) => {
  try {
    const { coworkerId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await clientService.getCoworkerClients(
      coworkerId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.clients,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Failed to get coworker clients', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve coworker clients',
      message: error.message,
    });
  }
});

/**
 * GET /clients/:id
 * Get client by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.getClientById(id);

    res.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    logger.error('Failed to get client', { error });
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve client',
      message: error.message,
    });
  }
});

/**
 * GET /clients/:id/statistics
 * Get client statistics
 */
router.get('/:id/statistics', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const statistics = await clientService.getClientStatistics(id);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    logger.error('Failed to get client statistics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve client statistics',
      message: error.message,
    });
  }
});

/**
 * POST /clients
 * Create a new client
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validatedData = CreateClientSchema.parse(req.body);

    // Use the authenticated user's coworker ID
    const userId = (req as any).user.id;
    const coworkerProfile = await prisma.coworkerProfile.findUnique({
      where: { userId },
    });

    if (!coworkerProfile) {
      return res.status(403).json({
        success: false,
        error: 'Only coworkers can create clients',
      });
    }

    const clientData = {
      ...validatedData,
      birthDate: validatedData.birthDate
        ? new Date(validatedData.birthDate)
        : undefined,
      coworkerId: userId,
    };

    const client = await clientService.createClient(clientData);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  } catch (error: any) {
    logger.error('Failed to create client', { error });
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create client',
      message: error.message,
    });
  }
});

/**
 * PUT /clients/:id
 * Update client information
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateClientSchema.parse(req.body);

    const updateData = {
      ...validatedData,
      birthDate: validatedData.birthDate
        ? new Date(validatedData.birthDate)
        : undefined,
    };

    const client = await clientService.updateClient(id, updateData);

    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update client', { error });
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update client',
      message: error.message,
    });
  }
});

/**
 * DELETE /clients/:id
 * Delete client (soft delete)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await clientService.deleteClient(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    logger.error('Failed to delete client', { error });
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete client',
      message: error.message,
    });
  }
});

/**
 * POST /clients/:id/coworkers
 * Add coworker to client
 */
router.post('/:id/coworkers', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { coworkerId } = req.body;

    if (!coworkerId) {
      return res.status(400).json({
        success: false,
        error: 'Coworker ID is required',
      });
    }

    const relationship = await clientService.addCoworkerToClient(
      id,
      coworkerId
    );

    res.status(201).json({
      success: true,
      data: relationship,
      message: 'Coworker added to client successfully',
    });
  } catch (error: any) {
    logger.error('Failed to add coworker to client', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to add coworker to client',
      message: error.message,
    });
  }
});

/**
 * DELETE /clients/:id/coworkers/:coworkerId
 * Remove coworker from client
 */
router.delete(
  '/:id/coworkers/:coworkerId',
  authMiddleware,
  async (req, res) => {
    try {
      const { id, coworkerId } = req.params;
      const result = await clientService.removeCoworkerFromClient(
        id,
        coworkerId
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Failed to remove coworker from client', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to remove coworker from client',
        message: error.message,
      });
    }
  }
);

/**
 * POST /clients/:id/documents
 * Upload document for client
 */
router.post(
  '/:id/documents',
  authMiddleware,
  uploadSingleFile('document'),
  handleUploadError,
  validateFilePresence,
  async (req, res) => {
    try {
      const { id: clientId } = req.params;
      const { documentType, notes } = req.body;
      const file = req.file as Express.Multer.File;

      // Upload to S3
      const { url, key, size } = await uploadToS3(file, `clients/${clientId}`);

      // Save document record in database
      const document = await prisma.clientDocument.create({
        data: {
          clientId,
          documentType: documentType || 'OTHER',
          fileName: file.originalname,
          fileUrl: url,
          fileKey: key,
          fileSize: size,
          mimeType: file.mimetype,
          notes,
        },
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      });
    } catch (error: any) {
      logger.error('Failed to upload document', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        message: error.message,
      });
    }
  }
);

/**
 * GET /clients/:id/documents
 * Get all documents for a client
 */
router.get('/:id/documents', authMiddleware, async (req, res) => {
  try {
    const { id: clientId } = req.params;

    const documents = await prisma.clientDocument.findMany({
      where: { clientId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    logger.error('Failed to get client documents', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents',
      message: error.message,
    });
  }
});

/**
 * DELETE /clients/:id/documents/:documentId
 * Delete a client document
 */
router.delete(
  '/:id/documents/:documentId',
  authMiddleware,
  async (req, res) => {
    try {
      const { documentId } = req.params;

      // Get document
      const document = await prisma.clientDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      // Delete from S3
      await deleteFromS3(document.fileKey);

      // Delete from database
      await prisma.clientDocument.delete({
        where: { id: documentId },
      });

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete document', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete document',
        message: error.message,
      });
    }
  }
);

export default router;

