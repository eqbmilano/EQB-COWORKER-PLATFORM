import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';
import { logger } from '../utils/logger';

const calendar = google.calendar('v3');

/**
 * Initialize OAuth2 client with credentials
 */
export function createOAuth2Client(accessToken: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

/**
 * Create event on EQB Milano Google Calendar
 */
export async function createCalendarEvent(
  auth: OAuth2Client,
  calendarId: string,
  eventData: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
    location?: string;
    isOnline?: boolean;
  }
): Promise<string> {
  try {
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'Europe/Rome',
      },
      attendees: eventData.attendees?.map(email => ({ email })),
      location: eventData.location,
      conferenceData: eventData.isOnline
        ? {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          }
        : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      auth,
      calendarId,
      requestBody: event,
      conferenceDataVersion: eventData.isOnline ? 1 : 0,
    });

    logger.info('Calendar event created', {
      eventId: response.data.id,
      summary: eventData.summary,
    });

    return response.data.id!;
  } catch (error) {
    logger.error('Failed to create calendar event', { error });
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update existing calendar event
 */
export async function updateCalendarEvent(
  auth: OAuth2Client,
  calendarId: string,
  eventId: string,
  eventData: {
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendees?: string[];
  }
): Promise<void> {
  try {
    const event: any = {};

    if (eventData.summary) event.summary = eventData.summary;
    if (eventData.description) event.description = eventData.description;
    if (eventData.startTime) {
      event.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'Europe/Rome',
      };
    }
    if (eventData.endTime) {
      event.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'Europe/Rome',
      };
    }
    if (eventData.attendees) {
      event.attendees = eventData.attendees.map(email => ({ email }));
    }

    await calendar.events.patch({
      auth,
      calendarId,
      eventId,
      requestBody: event,
    });

    logger.info('Calendar event updated', { eventId });
  } catch (error) {
    logger.error('Failed to update calendar event', { error, eventId });
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  auth: OAuth2Client,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    await calendar.events.delete({
      auth,
      calendarId,
      eventId,
    });

    logger.info('Calendar event deleted', { eventId });
  } catch (error) {
    logger.error('Failed to delete calendar event', { error, eventId });
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Get events from calendar in a time range
 */
export async function getCalendarEvents(
  auth: OAuth2Client,
  calendarId: string,
  startTime: Date,
  endTime: Date
): Promise<Array<{ id: string; start: Date; end: Date; summary: string }>> {
  try {
    const response = await calendar.events.list({
      auth,
      calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return events.map(event => ({
      id: event.id!,
      start: new Date(event.start?.dateTime || event.start?.date!),
      end: new Date(event.end?.dateTime || event.end?.date!),
      summary: event.summary || 'No title',
    }));
  } catch (error) {
    logger.error('Failed to get calendar events', { error });
    return [];
  }
}

/**
 * Check if time slot has conflicts with existing events
 */
export async function checkTimeConflicts(
  auth: OAuth2Client,
  calendarId: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<boolean> {
  try {
    const events = await getCalendarEvents(auth, calendarId, startTime, endTime);

    // Filter out the event we're updating (if any)
    const conflictingEvents = excludeEventId
      ? events.filter(e => e.id !== excludeEventId)
      : events;

    // Check if any event overlaps with the requested time
    for (const event of conflictingEvents) {
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      const requestStart = startTime.getTime();
      const requestEnd = endTime.getTime();

      // Check for overlap
      if (
        (requestStart >= eventStart && requestStart < eventEnd) ||
        (requestEnd > eventStart && requestEnd <= eventEnd) ||
        (requestStart <= eventStart && requestEnd >= eventEnd)
      ) {
        return true; // Conflict found
      }
    }

    return false; // No conflicts
  } catch (error) {
    logger.error('Failed to check time conflicts', { error });
    return true; // Assume conflict on error (safe default)
  }
}

/**
 * Get Google Meet link from event
 */
export async function getGoogleMeetLink(
  auth: OAuth2Client,
  calendarId: string,
  eventId: string
): Promise<string | null> {
  try {
    const response = await calendar.events.get({
      auth,
      calendarId,
      eventId,
    });

    return response.data.conferenceData?.entryPoints?.[0]?.uri || null;
  } catch (error) {
    logger.error('Failed to get Google Meet link', { error, eventId });
    return null;
  }
}

/**
 * Calculate available time slots for a coworker
 */
export function calculateAvailableSlots(
  workingHours: { start: string; end: string; enabled: boolean }[],
  existingEvents: Array<{ start: Date; end: Date }>,
  bufferMinutes: number,
  date: Date
): Array<{ start: Date; end: Date }> {
  const availableSlots: Array<{ start: Date; end: Date }> = [];

  for (const hours of workingHours) {
    if (!hours.enabled) continue;

    const [startHour, startMinute] = hours.start.split(':').map(Number);
    const [endHour, endMinute] = hours.end.split(':').map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMinute, 0, 0);

    // Check if this time slot conflicts with any existing event
    let hasConflict = false;
    for (const event of existingEvents) {
      const eventEndWithBuffer = new Date(event.end);
      eventEndWithBuffer.setMinutes(eventEndWithBuffer.getMinutes() + bufferMinutes);

      if (
        (slotStart >= event.start && slotStart < eventEndWithBuffer) ||
        (slotEnd > event.start && slotEnd <= eventEndWithBuffer) ||
        (slotStart <= event.start && slotEnd >= eventEndWithBuffer)
      ) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      availableSlots.push({ start: slotStart, end: slotEnd });
    }
  }

  return availableSlots;
}
