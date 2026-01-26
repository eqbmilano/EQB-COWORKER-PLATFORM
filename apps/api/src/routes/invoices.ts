/**
 * Invoice Routes
 * Endpoints per la gestione completa delle fatture
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import prisma from '../database/prisma.js';
import { createResponse } from '../utils/response.js';
import logger from '../logger.js';

const router = Router();

/**
 * Validation schemas
 */
const createInvoiceSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('EUR'),
  issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  notes: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/invoices
 * List all invoices for the authenticated user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        appointment: {
          userId: req.user?.id,
        },
      },
      include: {
        appointment: {
          include: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      appointmentId: inv.appointmentId,
      appointmentClientName: inv.appointment?.client?.name || 'Unknown',
      amount: inv.amount,
      currency: inv.currency,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      status: inv.status,
      notes: inv.notes,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

    res.json(createResponse(true, 'Invoices fetched successfully', formatted));
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json(createResponse(false, 'Failed to fetch invoices'));
  }
});

/**
 * GET /api/invoices/:id
 * Get single invoice by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            client: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json(createResponse(false, 'Invoice not found'));
    }

    // Verify ownership
    if (invoice.appointment?.userId !== req.user?.id) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }

    const formatted = {
      id: invoice.id,
      appointmentId: invoice.appointmentId,
      appointmentClientName: invoice.appointment?.client?.name || 'Unknown',
      amount: invoice.amount,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes,
      client: invoice.appointment?.client,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    res.json(createResponse(true, 'Invoice fetched successfully', formatted));
  } catch (error) {
    logger.error('Error fetching invoice:', error);
    res.status(500).json(createResponse(false, 'Failed to fetch invoice'));
  }
});

/**
 * POST /api/invoices
 * Create new invoice
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = createInvoiceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(createResponse(false, 'Validation error', validation.error.errors));
    }

    const { appointmentId, amount, currency, issueDate, dueDate, status, notes } = validation.data;

    // Verify appointment exists and belongs to user
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json(createResponse(false, 'Appointment not found'));
    }

    if (appointment.userId !== req.user?.id) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }

    const invoice = await prisma.invoice.create({
      data: {
        appointmentId,
        amount,
        currency,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status,
        notes,
      },
      include: {
        appointment: {
          include: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const formatted = {
      id: invoice.id,
      appointmentId: invoice.appointmentId,
      appointmentClientName: invoice.appointment?.client?.name || 'Unknown',
      amount: invoice.amount,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    res.status(201).json(createResponse(true, 'Invoice created successfully', formatted));
  } catch (error) {
    logger.error('Error creating invoice:', error);
    res.status(500).json(createResponse(false, 'Failed to create invoice'));
  }
});

/**
 * PATCH /api/invoices/:id
 * Update invoice
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = updateInvoiceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(createResponse(false, 'Validation error', validation.error.errors));
    }

    // Verify ownership
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        appointment: true,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json(createResponse(false, 'Invoice not found'));
    }

    if (existingInvoice.appointment?.userId !== req.user?.id) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }

    const updateData: any = { ...validation.data };
    if (updateData.issueDate) {
      updateData.issueDate = new Date(updateData.issueDate);
    }
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        appointment: {
          include: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const formatted = {
      id: updatedInvoice.id,
      appointmentId: updatedInvoice.appointmentId,
      appointmentClientName: updatedInvoice.appointment?.client?.name || 'Unknown',
      amount: updatedInvoice.amount,
      currency: updatedInvoice.currency,
      issueDate: updatedInvoice.issueDate,
      dueDate: updatedInvoice.dueDate,
      status: updatedInvoice.status,
      notes: updatedInvoice.notes,
      createdAt: updatedInvoice.createdAt,
      updatedAt: updatedInvoice.updatedAt,
    };

    res.json(createResponse(true, 'Invoice updated successfully', formatted));
  } catch (error) {
    logger.error('Error updating invoice:', error);
    res.status(500).json(createResponse(false, 'Failed to update invoice'));
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete invoice
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        appointment: true,
      },
    });

    if (!invoice) {
      return res.status(404).json(createResponse(false, 'Invoice not found'));
    }

    if (invoice.appointment?.userId !== req.user?.id) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.json(createResponse(true, 'Invoice deleted successfully'));
  } catch (error) {
    logger.error('Error deleting invoice:', error);
    res.status(500).json(createResponse(false, 'Failed to delete invoice'));
  }
});

import { generateInvoicePDF } from '../services/pdfService.js';

/**
 * GET /api/invoices/:id/pdf
 * Download invoice as PDF
 */
router.get('/:id/pdf', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            client: {
              select: {
                name: true,
                email: true,
                phone: true,
                companyName: true,
                address: true,
                city: true,
                zipCode: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json(createResponse(false, 'Invoice not found'));
    }

    // Verify ownership
    if (invoice.appointment?.userId !== req.user?.id) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }

    // Company data (from env or config)
    const companyData = {
      name: 'EQB Milano - Cinque Giornate',
      address: 'Viale Regina Margherita, 43',
      city: 'Milano',
      zipCode: '20122',
      email: 'info@eqbmilano.it',
      phone: process.env.COMPANY_PHONE || '',
      vat: process.env.COMPANY_VAT || '',
    };

    // Generate PDF
    const pdfBytes = await generateInvoicePDF(
      {
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        notes: invoice.notes || undefined,
        appointment: {
          type: invoice.appointment.type,
          startTime: invoice.appointment.startTime,
          endTime: invoice.appointment.endTime,
          durationHours: invoice.appointment.durationHours,
          roomType: invoice.appointment.roomType,
          roomNumber: invoice.appointment.roomNumber || undefined,
        },
        client: {
          name: invoice.appointment.client.name,
          email: invoice.appointment.client.email,
          phone: invoice.appointment.client.phone || undefined,
          companyName: invoice.appointment.client.companyName || undefined,
          address: invoice.appointment.client.address || undefined,
          city: invoice.appointment.client.city || undefined,
          zipCode: invoice.appointment.client.zipCode || undefined,
        },
      },
      companyData
    );

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fattura-${invoice.id.substring(0, 8)}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    logger.error('Error generating PDF:', error);
    res.status(500).json(createResponse(false, 'Failed to generate PDF'));
  }
});

export default router;

