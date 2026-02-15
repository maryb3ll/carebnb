/**
 * Timezone utility functions for consistent date/time handling
 *
 * STANDARDS:
 * 1. Database: Always store in UTC (PostgreSQL TIMESTAMPTZ)
 * 2. API: Always send/receive ISO strings (UTC with 'Z' suffix)
 * 3. Display: Convert to user's local time in browser
 * 4. Internal: Use local time methods for comparisons
 */

/**
 * Convert date string and time string to UTC ISO timestamp
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in "H:MM AM/PM" format
 * @returns {string} ISO timestamp in UTC (e.g., "2026-02-15T21:00:00.000Z")
 */
export function localDateTimeToUTC(date, time) {
  const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  // Convert to 24-hour format
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  // Create Date object in local timezone
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, hours, minutes, 0);

  // Convert to UTC ISO string
  return dateObj.toISOString();
}

/**
 * Extract time in HH:MM format from a Date object (local time)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Time in HH:MM format (e.g., "14:00")
 */
export function getLocalTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Extract date in YYYY-MM-DD format from a Date object (local time)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Date in YYYY-MM-DD format (e.g., "2026-02-15")
 */
export function getLocalDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalize time string from database (HH:MM:SS or HH:MM) to HH:MM
 * @param {string} time - Time string from database
 * @returns {string} Time in HH:MM format
 */
export function normalizeTime(time) {
  return time.substring(0, 5);
}

/**
 * Format ISO timestamp for display in local timezone
 * @param {string} isoString - ISO timestamp string
 * @param {Intl.DateTimeFormatOptions} options - Format options
 * @returns {string} Formatted date/time string
 */
export function formatLocalDateTime(isoString, options) {
  return new Date(isoString).toLocaleString('en-US', options);
}
