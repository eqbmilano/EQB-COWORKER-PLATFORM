import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  createOAuth2Client,
  createCalendarEvent,
  checkTimeConflicts,
} from '../services/googleCalendar';

// Define local type instead of importing from shared-types
interface PublicBookingRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/public/coworker/:token
 * Ottieni informazioni coworker da booking link pubblico
 */
router.get('/coworker/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const coworker = await prisma.coworker.findUnique({
      where: { bookingLinkToken: token },
      select: {
        id: true,
        userId: true,
        companyName: true,
        workingHours: true,
        bufferTimeMinutes: true,
        allowOnlineBooking: true,
      },
    });

    if (!coworker) {
      return res.status(404).json({
        success: false,
        message: 'Link di prenotazione non valido o scaduto',
      });
    }

    if (!coworker.allowOnlineBooking) {
      return res.status(403).json({
        success: false,
        message: 'Le prenotazioni online sono temporaneamente disabilitate',
      });
    }

    return res.json({
      success: true,
      data: {
        coworkerId: coworker.id,
        coworkerName: coworker.companyName || 'Coworker',
        workingHours: coworker.workingHours,
        bufferMinutes: coworker.bufferTimeMinutes || 15,
      },
    });
  } catch (error) {
    logger.error('Error fetching coworker by booking token:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle informazioni',
    });
  }
});

/**
 * POST /api/public/book/:token
 * Prenota appuntamento tramite link pubblico
 */
router.post('/book/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const bookingData: PublicBookingRequest = req.body;

    // Validazione input
    if (!bookingData.clientName || !bookingData.clientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Nome e email del cliente sono obbligatori',
      });
    }

    if (!bookingData.startTime || !bookingData.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Orario di inizio e fine sono obbligatori',
      });
    }

    // Trova coworker
    const coworker = await prisma.coworker.findUnique({
      where: { bookingLinkToken: token },
      include: {
        user: true,
      },
    });

    if (!coworker) {
      return res.status(404).json({
        success: false,
        message: 'Link di prenotazione non valido',
      });
    }

    if (!coworker.allowOnlineBooking) {
      return res.status(403).json({
        success: false,
        message: 'Le prenotazioni online non sono al momento disponibili',
      });
    }

    // Verifica se il cliente esiste già o crealo
    let client = await prisma.client.findUnique({
      where: { email: bookingData.clientEmail },
    });

    if (!client) {
      // Crea nuovo cliente
      client = await prisma.client.create({
        data: {
          email: bookingData.clientEmail,
          firstName: bookingData.clientName.split(' ')[0] || bookingData.clientName,
          lastName: bookingData.clientName.split(' ').slice(1).join(' ') || '',
          phone: bookingData.clientPhone || '',
          assignedToId: coworker.userId,
          source: 'PUBLIC_BOOKING',
        },
      });
    }

    // Ottieni le impostazioni calendario dell'organizzazione
    const calendarSettings = await prisma.googleCalendarSettings.findFirst();

    if (!calendarSettings?.organizationCalendarToken) {
      logger.warn('Google Calendar not configured, creating appointment without sync');
    }

    // Controlla conflitti di orario
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);
    const bufferMinutes = coworker.bufferTimeMinutes || 15;

    let hasConflict = false;
    let googleEventId: string | undefined;

    if (calendarSettings?.organizationCalendarToken && calendarSettings?.organizationCalendarId) {
      try {
        const auth = createOAuth2Client(calendarSettings.organizationCalendarToken);
        hasConflict = await checkTimeConflicts(
          auth,
          calendarSettings.organizationCalendarId,
          startTime,
          endTime
        );

        if (hasConflict) {
          return res.status(409).json({
            success: false,
            message: 'Lo slot selezionato non è più disponibile. Per favore scegli un altro orario.',
          });
        }

        // Crea evento su Google Calendar (in stato TENTATIVE)
        const eventData = {
          summary: `[PENDING] ${bookingData.title || 'Nuovo appuntamento'}`,
          description: `Richiesta di prenotazione da: ${bookingData.clientName}\nEmail: ${bookingData.clientEmail}\nTelefono: ${bookingData.clientPhone || 'N/A'}\n\nNote: ${bookingData.notes || 'Nessuna nota'}`,
          start: { dateTime: startTime.toISOString(), timeZone: 'Europe/Rome' },
          end: { dateTime: endTime.toISOString(), timeZone: 'Europe/Rome' },
          status: 'tentative',
          attendees: [
            { email: bookingData.clientEmail, displayName: bookingData.clientName },
            { email: coworker.user.email, displayName: coworker.companyName || coworker.user.username },
          ],
        };

        if (bookingData.isOnline) {
          eventData['conferenceData'] = {
            createRequest: {
              requestId: `booking-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          };
        }

        const createdEvent = await createCalendarEvent(
          auth,
          calendarSettings.organizationCalendarId,
          eventData
        );

        googleEventId = createdEvent.id;
      } catch (calendarError) {
        logger.error('Error creating calendar event:', calendarError);
        // Continua comunque con la creazione dell'appuntamento
      }
    }

    // Calcola buffer end time
    const bufferEndTime = new Date(endTime.getTime() + bufferMinutes * 60000);

    // Crea appuntamento con status PENDING
    const appointment = await prisma.appointment.create({
      data: {
        title: bookingData.title || 'Appuntamento',
        description: bookingData.notes || '',
        startTime,
        endTime,
        status: 'PENDING',
        type: bookingData.isOnline ? 'ONLINE' : 'IN_PERSON',
        clientId: client.id,
        coworkerId: coworker.id,
        createdById: coworker.userId,
        googleEventId,
        bookingSource: 'link',
        isOnline: bookingData.isOnline || false,
        bufferEndTime,
        reminderSent: false,
      },
      include: {
        client: true,
        coworker: {
          include: {
            user: true,
          },
        },
      },
    });

    // TODO: Invia email di notifica al coworker
    // TODO: Invia email di conferma al cliente

    logger.info(`Public booking created: ${appointment.id} for client ${client.email}`);

    return res.status(201).json({
      success: true,
      message: 'Richiesta di prenotazione inviata con successo! Riceverai una conferma via email entro 24 ore.',
      data: {
        appointmentId: appointment.id,
        status: appointment.status,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        coworker: {
          name: appointment.coworker.companyName || 'Coworker',
        },
      },
    });
  } catch (error) {
    logger.error('Error creating public booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la creazione della prenotazione. Riprova più tardi.',
    });
  }
});

/**
 * POST /api/public/appointments/:id/confirm
 * Conferma appuntamento da parte del coworker (via email link)
 */
router.post('/appointments/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { token } = req.body; // Token di sicurezza inviato via email

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        coworker: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appuntamento non trovato',
      });
    }

    if (appointment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Questo appuntamento è già stato gestito',
      });
    }

    // Verifica token (implementa logica di validazione token)
    // TODO: Implementa verifica token sicuro

    // Aggiorna stato appuntamento
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
      },
    });

    // Aggiorna evento su Google Calendar (da tentative a confirmed)
    if (appointment.googleEventId) {
      const calendarSettings = await prisma.googleCalendarSettings.findFirst();
      if (calendarSettings?.organizationCalendarToken && calendarSettings?.organizationCalendarId) {
        try {
          const auth = createOAuth2Client(calendarSettings.organizationCalendarToken);
          // TODO: Update event status to 'confirmed'
        } catch (error) {
          logger.error('Error updating calendar event status:', error);
        }
      }
    }

    // TODO: Invia email di conferma al cliente

    return res.json({
      success: true,
      message: 'Appuntamento confermato con successo',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error('Error confirming appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la conferma dell\'appuntamento',
    });
  }
});

export default router;
