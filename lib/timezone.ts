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
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in "H:MM AM/PM" format
 * @returns ISO timestamp in UTC (e.g., "2026-02-15T21:00:00.000Z")
 */
export function localDateTimeToUTC(date: string, time: string): string {
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
 * @param date - Date object or ISO string
 * @returns Time in HH:MM format (e.g., "14:00")
 */
export function getLocalTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Extract date in YYYY-MM-DD format from a Date object (local time)
 * @param date - Date object or ISO string
 * @returns Date in YYYY-MM-DD format (e.g., "2026-02-15")
 */
export function getLocalDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extract day of week from a Date object (local time)
 * @param date - Date object or ISO string
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export function getLocalDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
}

/**
 * Normalize time string from database (HH:MM:SS or HH:MM) to HH:MM
 * @param time - Time string from database
 * @returns Time in HH:MM format
 */
export function normalizeTime(time: string): string {
  return time.substring(0, 5);
}

/**
 * Format ISO timestamp for display in local timezone
 * @param isoString - ISO timestamp string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date/time string
 */
export function formatLocalDateTime(
  isoString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(isoString).toLocaleString('en-US', options);
}

/**
 * Check if a time slot overlaps with a time range
 * @param slotStart - Start of slot (Date or ISO string)
 * @param slotEnd - End of slot (Date or ISO string)
 * @param rangeStart - Start of range (Date or ISO string)
 * @param rangeEnd - End of range (Date or ISO string)
 * @returns true if there's overlap
 */
export function hasTimeOverlap(
  slotStart: Date | string,
  slotEnd: Date | string,
  rangeStart: Date | string,
  rangeEnd: Date | string
): boolean {
  const ss = typeof slotStart === 'string' ? new Date(slotStart) : slotStart;
  const se = typeof slotEnd === 'string' ? new Date(slotEnd) : slotEnd;
  const rs = typeof rangeStart === 'string' ? new Date(rangeStart) : rangeStart;
  const re = typeof rangeEnd === 'string' ? new Date(rangeEnd) : rangeEnd;

  return ss < re && se > rs;
}
