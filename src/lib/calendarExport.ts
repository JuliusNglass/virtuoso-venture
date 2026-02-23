/**
 * Calendar export utilities — ICS file generation & Google Calendar links.
 * Works on iOS (Apple Calendar), Android (Google Calendar), and desktop.
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  /** Duration in minutes (default 30) */
  durationMinutes?: number;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toICSDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function toGoogleDate(d: Date): string {
  // Google Calendar uses UTC format: YYYYMMDDTHHmmssZ
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/**
 * Generate and download an .ics file (universal — works on all platforms)
 */
export function downloadICS(event: CalendarEvent) {
  const duration = event.durationMinutes ?? 30;
  const endDate = new Date(event.startDate.getTime() + duration * 60000);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shanika Piano Academy//EN",
    "BEGIN:VEVENT",
    `DTSTART:${toICSDate(event.startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.location ? `LOCATION:${event.location}` : "",
    `UID:${crypto.randomUUID()}@shanika-piano`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open Google Calendar "add event" page (works on Android natively, iOS via browser)
 */
export function openGoogleCalendar(event: CalendarEvent) {
  const duration = event.durationMinutes ?? 30;
  const endDate = new Date(event.startDate.getTime() + duration * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleDate(event.startDate)}/${toGoogleDate(endDate)}`,
    ...(event.description && { details: event.description }),
    ...(event.location && { location: event.location }),
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
}
