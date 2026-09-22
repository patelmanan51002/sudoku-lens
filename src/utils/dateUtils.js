// Utilities for date extraction, formatting, and time tracking

/**
 * Gets current system date and time as ISO string
 */
export function getSystemDateTimeISO() {
  return new Date().toISOString();
}

/**
 * Converts ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export function toInputDateTimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats datetime for display (e.g., "Sep 23, 2026, 12:49 AM")
 */
export function formatDateTime(isoString) {
  if (!isoString) return 'Unknown Date';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unknown Date';

  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Returns a friendly date header string for date-wise grouping
 * (e.g. "Today", "Yesterday", or "September 23, 2026")
 */
export function formatDateHeader(isoString) {
  if (!isoString) return 'Unspecified Date';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unspecified Date';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Gets YYYY-MM-DD key for grouping
 */
export function getDateKey(isoString) {
  if (!isoString) return 'unknown';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'unknown';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats elapsed seconds to MM:SS or HH:MM:SS
 */
export function formatSeconds(sec) {
  if (!sec || isNaN(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Formats duration in human words (e.g. "4m 32s" or "1h 15m")
 */
export function formatHumanDuration(sec) {
  if (!sec || isNaN(sec) || sec <= 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}
