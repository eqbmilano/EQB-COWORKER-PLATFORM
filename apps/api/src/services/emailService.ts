import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger.js';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@eqbplatform.com';
const FROM_NAME = process.env.FROM_NAME || 'EQB Platform';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info('SendGrid initialized');
} else {
  logger.warn('SendGrid API key not configured - emails will be logged only');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send email using SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!SENDGRID_API_KEY) {
      logger.warn('Email sending disabled - would send:', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      await sgMail.send({
        to: options.to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      logger.info(`Email sent successfully to ${options.to}: ${options.subject}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(
    clientEmail: string,
    clientName: string,
    appointmentDate: Date,
    duration: number,
    coworkerName: string,
    notes?: string
  ): Promise<boolean> {
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(appointmentDate);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Conferma Appuntamento</h1>
          </div>
          <div class="content">
            <p>Gentile ${clientName},</p>
            <p>Il tuo appuntamento è stato confermato con successo.</p>
            
            <div class="details">
              <h2 style="margin-top: 0; color: #2563eb;">Dettagli Appuntamento</h2>
              <div class="detail-row">
                <span class="detail-label">Data e Ora:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Durata:</span>
                <span>${duration} ore</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Operatore:</span>
                <span>${coworkerName}</span>
              </div>
              ${notes ? `
                <div class="detail-row">
                  <span class="detail-label">Note:</span>
                  <span>${notes}</span>
                </div>
              ` : ''}
            </div>
            
            <p>Riceverai un promemoria 24 ore prima dell'appuntamento.</p>
            <p>Se hai bisogno di modificare o cancellare l'appuntamento, ti preghiamo di contattarci il prima possibile.</p>
            
            <p style="margin-top: 30px;">Cordiali saluti,<br>Il Team EQB</p>
          </div>
          <div class="footer">
            <p>Questa è una email automatica, si prega di non rispondere.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: clientEmail,
      subject: 'Conferma Appuntamento - EQB Platform',
      html,
    });
  }

  /**
   * Send appointment reminder email (24h before)
   */
  async sendAppointmentReminder(
    clientEmail: string,
    clientName: string,
    appointmentDate: Date,
    duration: number,
    coworkerName: string
  ): Promise<boolean> {
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(appointmentDate);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder-box { background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Promemoria Appuntamento</h1>
          </div>
          <div class="content">
            <p>Gentile ${clientName},</p>
            <p><strong>Ti ricordiamo che il tuo appuntamento è previsto per domani.</strong></p>
            
            <div class="reminder-box">
              <h2 style="margin-top: 0; color: #f59e0b;">Dettagli</h2>
              <p><strong>Data e Ora:</strong> ${formattedDate}</p>
              <p><strong>Durata:</strong> ${duration} ore</p>
              <p><strong>Operatore:</strong> ${coworkerName}</p>
            </div>
            
            <p>Ti aspettiamo!</p>
            <p>Se non puoi più partecipare, ti preghiamo di avvisarci il prima possibile.</p>
            
            <p style="margin-top: 30px;">A presto,<br>Il Team EQB</p>
          </div>
          <div class="footer">
            <p>Questa è una email automatica, si prega di non rispondere.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: clientEmail,
      subject: '⏰ Promemoria: Appuntamento domani - EQB Platform',
      html,
    });
  }

  /**
   * Send appointment completion email
   */
  async sendAppointmentCompletion(
    clientEmail: string,
    clientName: string,
    appointmentDate: Date,
    coworkerName: string
  ): Promise<boolean> {
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'long',
    }).format(appointmentDate);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Grazie per la tua visita!</h1>
          </div>
          <div class="content">
            <p>Gentile ${clientName},</p>
            <p>Grazie per aver scelto i nostri servizi.</p>
            <p>Il tuo appuntamento del <strong>${formattedDate}</strong> con ${coworkerName} è stato completato.</p>
            
            <p>Ci auguriamo che tu sia soddisfatto del servizio ricevuto.</p>
            <p>Se hai domande o desideri fissare un nuovo appuntamento, non esitare a contattarci.</p>
            
            <p style="margin-top: 30px;">Cordiali saluti,<br>Il Team EQB</p>
          </div>
          <div class="footer">
            <p>Questa è una email automatica, si prega di non rispondere.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: clientEmail,
      subject: 'Grazie per la tua visita - EQB Platform',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.WEB_BASE_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Reset Password</h1>
          </div>
          <div class="content">
            <p>Ciao ${userName},</p>
            <p>Hai richiesto il reset della tua password.</p>
            <p>Clicca sul pulsante qui sotto per procedere:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p><strong>Questo link è valido per 1 ora.</strong></p>
            <p>Se non hai richiesto il reset della password, ignora questa email.</p>
            
            <p style="margin-top: 30px;">Cordiali saluti,<br>Il Team EQB</p>
          </div>
          <div class="footer">
            <p>Se il pulsante non funziona, copia e incolla questo link nel browser:</p>
            <p style="font-size: 12px; word-break: break-all;">${resetUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: 'Reset Password - EQB Platform',
      html,
    });
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();

