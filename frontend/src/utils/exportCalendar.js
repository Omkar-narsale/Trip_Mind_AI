/**
 * Utilities for syncing itinerary activities with Google Calendar & Apple/Outlook (.ics)
 */

/**
 * Formats a date string (YYYY-MM-DD) and time string (HH:MM) to iCalendar datetime string (YYYYMMDDTHHMMSS)
 */
function formatIcsDateTime(dateStr, timeStr) {
  try {
    const cleanDate = dateStr.replace(/[^0-9]/g, '');
    let cleanTime = '090000';
    if (timeStr) {
      const parts = timeStr.split(':');
      const hours = parts[0] ? parts[0].padStart(2, '0') : '09';
      const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
      cleanTime = `${hours}${minutes}00`;
    }
    return `${cleanDate}T${cleanTime}`;
  } catch (e) {
    return '20261001T090000';
  }
}

/**
 * Adds hours/minutes to an iCalendar datetime string for DTEND
 */
function addDuration(icsDateTime, durationHours = 1.5) {
  try {
    const year = parseInt(icsDateTime.slice(0, 4), 10);
    const month = parseInt(icsDateTime.slice(4, 6), 10) - 1;
    const day = parseInt(icsDateTime.slice(6, 8), 10);
    const hour = parseInt(icsDateTime.slice(9, 11), 10);
    const minute = parseInt(icsDateTime.slice(11, 13), 10);

    const d = new Date(year, month, day, hour, minute);
    d.setMinutes(d.getMinutes() + Math.round(durationHours * 60));

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');

    return `${y}${m}${da}T${h}${mi}00`;
  } catch (e) {
    return icsDateTime;
  }
}

/**
 * Cleans text for iCalendar description field
 */
function escapeIcsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 standard .ics file string from the trip's itineraryData
 */
export function generateIcsContent(itineraryData, destination = 'Destination', hotelName = 'Selected Stay') {
  const days = itineraryData?.days || [];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripMind AI//Travel Concierge//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:TripMind — ${destination} Itinerary`
  ];

  days.forEach((day) => {
    const dayDate = day.date || '2026-10-01';
    const activities = day.activities || [];

    activities.forEach((act, idx) => {
      const dtStart = formatIcsDateTime(dayDate, act.time);
      const dtEnd = addDuration(dtStart, 1.5);
      const summary = `${act.title} (${destination})`;
      const location = act.place_name ? `${act.place_name}, ${destination}` : destination;
      
      let description = act.description || '';
      if (act.transport_mode) {
        description += `\\nTransit Mode: ${act.transport_mode}`;
      }
      if (act.distance_km) {
        description += ` (~${act.distance_km} km)`;
      }
      if (act.accessibility_notes) {
        description += `\\nNote: ${act.accessibility_notes}`;
      }
      description += `\\nTripMind AI Journey anchored at ${hotelName}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:tripmind-${day.day_number}-${idx}-${dtStart}@tripmind.ai`);
      lines.push(`DTSTAMP:${formatIcsDateTime(new Date().toISOString().slice(0, 10), '12:00')}Z`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
      lines.push(`LOCATION:${escapeIcsText(location)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a direct browser download of the complete .ics calendar file
 */
export function downloadIcsCalendar(itineraryData, destination = 'Trip', hotelName = 'Selected Hotel') {
  const content = generateIcsContent(itineraryData, destination, hotelName);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeDest = destination.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `TripMind_${safeDest}_Itinerary.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Builds a Google Calendar web URL to add a single event or day hub
 */
export function buildGoogleCalendarUrl({
  title,
  date,
  time = '10:00',
  description = '',
  location = '',
  durationHours = 2
}) {
  const dtStart = formatIcsDateTime(date, time);
  const dtEnd = addDuration(dtStart, durationHours);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: description,
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
