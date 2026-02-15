/**
 * Search filtering and ranking for patient search.
 * Used by the search page and the results page.
 */

export const CARE_TYPE_SPECIALTY_KEYWORDS = {
  'cold-flu': ['nurse', 'primary care', 'family medicine', 'pediatrician', 'internal medicine'],
  'fever-check': ['nurse', 'primary care', 'pediatrician', 'family medicine'],
  'infection-monitoring': ['nurse', 'nurse practitioner', 'primary care'],
  'medication-help': ['nurse', 'nurse practitioner', 'primary care', 'geriatrician'],
  'general-nurse': ['nurse', 'registered nurse', 'licensed practical', 'nurse practitioner'],
  'blood-draw': ['nurse', 'licensed practical', 'iv', 'clinical'],
  'iv-therapy': ['nurse', 'iv', 'licensed practical'],
  'injection': ['nurse', 'licensed practical', 'nurse practitioner'],
  'chemo': ['nurse', 'licensed practical', 'nurse practitioner'],
  'wound-care': ['nurse', 'wound', 'registered nurse', 'nurse practitioner'],
  'post-surgery': ['nurse', 'nurse practitioner', 'primary care', 'physical therapist'],
  'chronic-condition': ['nurse practitioner', 'primary care', 'internal medicine', 'geriatrician'],
  'medication-management': ['nurse practitioner', 'primary care', 'internal medicine'],
  'vital-signs': ['nurse', 'nurse practitioner', 'registered nurse'],
  'physical-therapy': ['physical therapist', 'pt', 'rehabilitation'],
  'lactation': ['lactation', 'nurse practitioner'],
  'elder-support': ['geriatrician', 'nurse', 'primary care', 'internal medicine'],
  'palliative': ['palliative', 'nurse', 'nurse practitioner']
};

export function filterProvidersByCareType(providers, careType) {
  if (!careType?.trim() || !Array.isArray(providers)) return providers;
  const keywords = CARE_TYPE_SPECIALTY_KEYWORDS[careType];
  if (!keywords?.length) return providers;
  const lower = (s) => (s || '').toLowerCase();
  return providers.filter((p) => {
    const specialty = lower(p.specialty);
    const creds = (p.credentials || []).join(' ').toLowerCase();
    return keywords.some((kw) => specialty.includes(kw) || creds.includes(kw));
  });
}

const WEIGHT_CARE_TYPE = 0.4;
const WEIGHT_LOCATION = 0.35;
const WEIGHT_DATETIME = 0.25;

function careTypeScore(provider, careType) {
  if (!careType?.trim()) return 1;
  const keywords = CARE_TYPE_SPECIALTY_KEYWORDS[careType];
  if (!keywords?.length) return 1;
  const lower = (s) => (s || '').toLowerCase();
  const specialty = lower(provider.specialty);
  const creds = (provider.credentials || []).join(' ').toLowerCase();
  const matchCount = keywords.filter((kw) => specialty.includes(kw) || creds.includes(kw)).length;
  if (matchCount === 0) return 0;
  if (matchCount >= 2) return 1;
  return 0.75;
}

function locationScore(provider) {
  const dist = parseFloat(provider.distance);
  if (Number.isNaN(dist)) return 0.5;
  if (dist <= 0) return 1;
  return Math.max(0, 1 - dist / 25);
}

function dateTimeScore(provider, requestedWhen) {
  if (!requestedWhen) return 1;
  const req = new Date(requestedWhen);
  if (Number.isNaN(req.getTime())) return 1;
  const next = provider.nextAvailableDate;
  if (!next || !(next instanceof Date) || Number.isNaN(next.getTime())) return 0.5;
  const diffMs = next.getTime() - req.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffHours <= 0 && diffHours > -2) return 1;
  if (diffHours <= 2 && diffDays < 1) return 0.95;
  if (diffDays >= 0 && diffDays < 1) return 0.85;
  if (diffDays >= 0 && diffDays < 2) return 0.65;
  if (diffDays >= 0 && diffDays < 4) return 0.45;
  return 0.25;
}

/**
 * Rank providers by type of care match, then location, then date/time.
 * Returns a new array of providers sorted by score (best first).
 */
export function rankProviders(providers, searchParams) {
  if (!Array.isArray(providers) || providers.length === 0) return [];
  const careType = searchParams?.careType;
  const when = searchParams?.time;
  const withScores = providers.map((p) => {
    const care = careTypeScore(p, careType);
    const loc = locationScore(p);
    const dt = dateTimeScore(p, when);
    const total = WEIGHT_CARE_TYPE * care + WEIGHT_LOCATION * loc + WEIGHT_DATETIME * dt;
    return { provider: p, score: total };
  });
  withScores.sort((a, b) => b.score - a.score);
  return withScores.map((x) => x.provider);
}
