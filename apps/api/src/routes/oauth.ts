import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this-in-production-32-chars';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Critta il token OAuth per storage sicuro
 */
function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decripta il token OAuth dallo storage
 */
function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Crea OAuth2 client
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * GET /api/auth/google/connect
 * Inizia il flow OAuth per connettere Google Calendar
 */
router.get('/google/connect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    // Verifica che l'utente sia un coworker
    const coworker = await prisma.coworker.findUnique({
      where: { userId },
    });

    if (!coworker) {
      return res.status(403).json({
        success: false,
        message: 'Solo i coworker possono connettere il proprio calendario',
      });
    }

    const oauth2Client = createOAuth2Client();

    // Scopes necessari: calendario read-only
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Passa userId nello state per recuperarlo nel callback
      prompt: 'consent', // Forza il prompt per ottenere refresh token
    });

    return res.json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error) {
    logger.error('Error generating OAuth URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la generazione del link di autenticazione',
    });
  }
});

/**
 * GET /api/auth/google/callback
 * Callback OAuth dopo autorizzazione Google
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).send('Codice di autorizzazione mancante');
    }

    const userId = state as string;

    if (!userId) {
      return res.status(400).send('State parameter mancante');
    }

    const coworker = await prisma.coworker.findUnique({
      where: { userId },
    });

    if (!coworker) {
      return res.status(404).send('Coworker non trovato');
    }

    const oauth2Client = createOAuth2Client();

    // Scambia il code per i tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      logger.warn('No refresh token received, user may have already granted access');
    }

    // Salva il refresh token (o access token se refresh non disponibile)
    const tokenToStore = tokens.refresh_token || tokens.access_token;

    if (!tokenToStore) {
      throw new Error('No token received from Google');
    }

    // Cripta il token prima di salvarlo
    const encryptedToken = encryptToken(tokenToStore);

    // Ottieni l'ID del calendario primario dell'utente
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((cal) => cal.primary);

    if (!primaryCalendar?.id) {
      throw new Error('Could not find primary calendar');
    }

    // Aggiorna coworker con token e calendar ID
    await prisma.coworker.update({
      where: { id: coworker.id },
      data: {
        googleCalendarToken: encryptedToken,
        googleCalendarId: primaryCalendar.id,
      },
    });

    logger.info(`Google Calendar connected for coworker ${coworker.id}`);

    // Redirect al frontend con successo
    const frontendUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard/settings?calendar=connected`);
  } catch (error) {
    logger.error('Error in OAuth callback:', error);
    const frontendUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard/settings?calendar=error`);
  }
});

/**
 * DELETE /api/auth/google/disconnect
 * Disconnetti Google Calendar
 */
router.delete('/google/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    const coworker = await prisma.coworker.findUnique({
      where: { userId },
    });

    if (!coworker) {
      return res.status(404).json({
        success: false,
        message: 'Coworker non trovato',
      });
    }

    // Revoca il token su Google (opzionale ma consigliato)
    if (coworker.googleCalendarToken) {
      try {
        const decryptedToken = decryptToken(coworker.googleCalendarToken);
        const oauth2Client = createOAuth2Client();
        await oauth2Client.revokeToken(decryptedToken);
      } catch (error) {
        logger.warn('Failed to revoke token on Google:', error);
        // Continua comunque con la rimozione locale
      }
    }

    // Rimuovi token e calendar ID dal database
    await prisma.coworker.update({
      where: { id: coworker.id },
      data: {
        googleCalendarToken: null,
        googleCalendarId: null,
      },
    });

    logger.info(`Google Calendar disconnected for coworker ${coworker.id}`);

    return res.json({
      success: true,
      message: 'Google Calendar disconnesso con successo',
    });
  } catch (error) {
    logger.error('Error disconnecting Google Calendar:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la disconnessione del calendario',
    });
  }
});

/**
 * GET /api/auth/google/status
 * Verifica stato connessione Google Calendar
 */
router.get('/google/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    const coworker = await prisma.coworker.findUnique({
      where: { userId },
      select: {
        googleCalendarId: true,
        googleCalendarToken: true,
      },
    });

    if (!coworker) {
      return res.status(404).json({
        success: false,
        message: 'Coworker non trovato',
      });
    }

    const isConnected = !!(coworker.googleCalendarToken && coworker.googleCalendarId);

    return res.json({
      success: true,
      data: {
        connected: isConnected,
        calendarId: coworker.googleCalendarId || null,
      },
    });
  } catch (error) {
    logger.error('Error checking Google Calendar status:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la verifica dello stato',
    });
  }
});

/**
 * POST /api/coworkers/booking-link/generate
 * Genera o rigenera il booking link token
 */
router.post('/booking-link/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    const coworker = await prisma.coworker.findUnique({
      where: { userId },
    });

    if (!coworker) {
      return res.status(404).json({
        success: false,
        message: 'Coworker non trovato',
      });
    }

    // Genera nuovo token unico
    const token = crypto.randomBytes(32).toString('hex');

    await prisma.coworker.update({
      where: { id: coworker.id },
      data: {
        bookingLinkToken: token,
        allowOnlineBooking: true,
      },
    });

    const bookingUrl = `${process.env.WEB_BASE_URL}/book/${token}`;

    logger.info(`Booking link generated for coworker ${coworker.id}`);

    return res.json({
      success: true,
      data: {
        token,
        bookingUrl,
      },
    });
  } catch (error) {
    logger.error('Error generating booking link:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la generazione del link',
    });
  }
});

/**
 * PATCH /api/coworkers/booking-link/toggle
 * Abilita/disabilita booking online
 */
router.patch('/booking-link/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Il parametro "enabled" deve essere un booleano',
      });
    }

    const coworker = await prisma.coworker.findUnique({
      where: { userId },
    });

    if (!coworker) {
      return res.status(404).json({
        success: false,
        message: 'Coworker non trovato',
      });
    }

    await prisma.coworker.update({
      where: { id: coworker.id },
      data: {
        allowOnlineBooking: enabled,
      },
    });

    logger.info(`Online booking ${enabled ? 'enabled' : 'disabled'} for coworker ${coworker.id}`);

    return res.json({
      success: true,
      data: {
        allowOnlineBooking: enabled,
      },
    });
  } catch (error) {
    logger.error('Error toggling online booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento delle impostazioni',
    });
  }
});

export { encryptToken, decryptToken };
export default router;
