/**
 * In-memory activity log for the AI intake pipeline (testing only).
 * Entries are pushed when /api/intake/analyze is called.
 */

export type IntakeActivityEntry = {
  id: string;
  at: string; // ISO timestamp
  type: "text" | "audio";
  status: "success" | "error" | "unavailable";
  sessionId?: string;
  error?: string;
};

const MAX_ENTRIES = 100;
const log: IntakeActivityEntry[] = [];
let idCounter = 0;

export function addIntakeActivity(entry: Omit<IntakeActivityEntry, "id" | "at">) {
  log.unshift({
    id: `entry-${++idCounter}-${Date.now()}`,
    at: new Date().toISOString(),
    ...entry,
  });
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
}

export function getIntakeActivity(limit = 50): IntakeActivityEntry[] {
  return log.slice(0, limit);
}
