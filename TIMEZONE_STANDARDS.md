# Timezone Standardization Guide

## Overview
This document outlines the timezone handling standards for the CareBnB application to ensure consistency and prevent timezone-related bugs.

## Core Principles

### 1. **Database Storage**
- ✅ Always store timestamps in **UTC**
- ✅ Use PostgreSQL `TIMESTAMPTZ` type
- ✅ Example: `2026-02-15T21:00:00.000Z` (1 PM PST stored as 9 PM UTC)

### 2. **API Communication**
- ✅ Frontend → Backend: Send ISO strings with UTC (`.toISOString()`)
- ✅ Backend → Frontend: Return ISO strings with UTC
- ✅ Example: `"2026-02-15T21:00:00.000Z"`

### 3. **Display to Users**
- ✅ Convert UTC to user's local timezone in the browser
- ✅ Use `toLocaleString()`, `toLocaleDateString()`, `toLocaleTimeString()`
- ✅ Example: `new Date(utcString).toLocaleString('en-US', options)`

### 4. **Internal Processing**
- ✅ Use `Date` object methods for local time: `getHours()`, `getMinutes()`, `getDay()`
- ✅ Never use string manipulation for timezone conversion
- ✅ Use utility functions from `/lib/timezone.ts` or `/lib/timezone.js`

## Utility Functions

### Frontend (`/front end/src/lib/timezone.js`)
```javascript
import { localDateTimeToUTC, normalizeTime, formatLocalDateTime } from '../lib/timezone';

// Convert user input to UTC
const utcTimestamp = localDateTimeToUTC('2026-02-15', '1:00 PM');
// Returns: "2026-02-15T21:00:00.000Z" (if PST)

// Normalize database time
const time = normalizeTime('09:00:00'); // "09:00"

// Format for display
const display = formatLocalDateTime(utcString, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});
```

### Backend (`/lib/timezone.ts`)
```typescript
import { getLocalTime, getLocalDate, getLocalDayOfWeek, normalizeTime } from '@/lib/timezone';

// Extract local time from UTC timestamp
const timeStr = getLocalTime(scheduledAt); // "14:00"
const dateStr = getLocalDate(scheduledAt); // "2026-02-15"
const dayOfWeek = getLocalDayOfWeek(scheduledAt); // 0-6

// Normalize database times
const time = normalizeTime('09:00:00'); // "09:00"
```

## Common Patterns

### ✅ Correct: Converting user input to UTC
```javascript
// User selects: Feb 15, 2026 at 1:00 PM (local time)
const utcTimestamp = localDateTimeToUTC('2026-02-15', '1:00 PM');
// Sends to API: "2026-02-15T21:00:00.000Z" (UTC)
```

### ❌ Incorrect: Sending ambiguous timestamps
```javascript
// DON'T DO THIS
const when = `${date}T${hour}:${minute}:00`; // No timezone info!
// Ambiguous: Is this UTC or local time?
```

### ✅ Correct: Displaying UTC timestamps
```javascript
// Receive from API: "2026-02-15T21:00:00.000Z" (UTC)
const display = new Date(utcString).toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});
// Shows: "Feb 15, 1:00 PM" (in user's local timezone)
```

### ❌ Incorrect: String manipulation for display
```javascript
// DON'T DO THIS
const parts = utcString.split('T');
const time = parts[1].substring(0, 5); // Shows UTC time, not local!
```

### ✅ Correct: Comparing times in backend
```javascript
// Provider availability: 09:00 - 17:00 (local time)
const timeStr = getLocalTime(scheduledAt); // "14:00" (local)
const startTime = normalizeTime(schedule.start_time); // "09:00"
if (timeStr >= startTime && timeStr < endTime) {
  // Time is within working hours
}
```

### ❌ Incorrect: Using UTC for local comparison
```javascript
// DON'T DO THIS
const timeStr = scheduledAt.toISOString().split('T')[1]; // UTC time!
if (timeStr >= schedule.start_time) { // Comparing UTC to local time!
  // Wrong timezone!
}
```

## Files Using Timezone Utilities

### Frontend
- ✅ `/front end/src/pages/patient-search-and-booking/components/BookingPanel.jsx`
- ✅ `/front end/src/pages/patient-search-and-booking/components/ProviderModal.jsx`
- ✅ `/front end/src/pages/provider-dashboard-and-management/components/AvailabilityEditor.jsx`

### Backend
- ✅ `/app/api/bookings/route.ts`
- ✅ `/app/api/providers/[id]/slots/route.ts`
- ⚠️ `/app/api/intake/process/route.ts` (stores `requested_start` from frontend)

## Testing Timezone Handling

### Quick Test
1. Book an appointment for 1:00 PM today
2. Check database: Should be stored as UTC (9:00 PM UTC if PST)
3. Check display: Should show as 1:00 PM in local time

### Cross-Timezone Test
1. Change your system timezone (e.g., PST → EST)
2. Refresh the page
3. Appointments should display in the new timezone
4. New bookings should still work correctly

## Troubleshooting

### Symptom: Times are off by several hours
**Cause:** Frontend sending local time as UTC, or vice versa
**Fix:** Use `localDateTimeToUTC()` to convert user input to UTC

### Symptom: Times change when refreshing
**Cause:** Inconsistent timezone interpretation
**Fix:** Ensure all timestamps have 'Z' suffix (UTC)

### Symptom: Availability check fails for valid times
**Cause:** Comparing UTC times to local working hours
**Fix:** Use `getLocalTime()` to extract local time from UTC timestamps

### Symptom: Database times show seconds (HH:MM:SS)
**Cause:** PostgreSQL `TIME` type includes seconds
**Fix:** Use `normalizeTime()` to extract HH:MM

## Migration Notes

### Before Standardization
- ❌ Mixed timezone handling
- ❌ String manipulation for dates
- ❌ Ambiguous timestamps without 'Z'

### After Standardization
- ✅ Consistent UTC storage
- ✅ Utility functions for conversion
- ✅ Clear timezone specifications

## Maintenance

### Adding New Date/Time Features
1. Use utility functions from `/lib/timezone`
2. Always store in UTC (database)
3. Always send/receive ISO strings (API)
4. Always display in local time (frontend)
5. Document any special handling

### Code Review Checklist
- [ ] Does it use `toISOString()` for API communication?
- [ ] Does it use `getLocalTime()` for validation?
- [ ] Does it use `toLocaleString()` for display?
- [ ] Does it use `normalizeTime()` for database times?
- [ ] Does it avoid string manipulation for timezone conversion?

## References

- MDN: [Date.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- MDN: [Date.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
- PostgreSQL: [TIMESTAMPTZ](https://www.postgresql.org/docs/current/datatype-datetime.html)
