/**
 * The Google Sheet that copied rows get pasted into, one per calendar year.
 *
 * Add next year's sheet here when it is created; the old ones stay so past
 * years remain reachable. Keys are years, values the sheet URL.
 */
export const TRACKERS: Record<string, string> = {
  '2025': 'https://docs.google.com/spreadsheets/d/1KhFH086glyXGqnTahUWLzzJOGQiPS10esBNkL-a-qpE/edit',
  '2026': 'https://docs.google.com/spreadsheets/d/1ocuOdkqp2zjw6rwrZBHgh-cqjn2HNTTwL7Foz4gGWtg/edit',
};

export type Tracker = { year: string; url: string };

/** Years we have a sheet for, newest first. */
export const trackerYears = (): string[] =>
  Object.keys(TRACKERS).sort((a, b) => Number(b) - Number(a));

/**
 * The sheet to use for a given year. Falls back to the most recent year we
 * actually have, so the link keeps working in January before the new sheet
 * exists rather than silently disappearing.
 */
export function trackerFor(year: number = new Date().getFullYear()): Tracker | null {
  const years = trackerYears();
  if (!years.length) return null;
  const match = years.find((y) => Number(y) <= year) ?? years[years.length - 1];
  return { year: match, url: TRACKERS[match] };
}
