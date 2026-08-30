import type { SavedItem, SavedRequest } from './api.ts';

export type SheetRow = {
  name: string; date: string; amount: string; item: string;
  code: string; description: string; receiptLink: string; expenseLink: string;
};

export const SHEET_HEADERS = [
  'Name', 'Date', 'Amount', 'Item', 'Code', 'Description', 'Receipt Link', 'Expense Link',
] as const;

const usd = (n: number) => `$${n.toFixed(2)}`;
const mdy = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${m}/${d}/${y}`;
};

/** `Communion - Giant` — the category line and the store, as one cell. */
const describe = (it: SavedItem) =>
  [it.description, it.vendor].filter(Boolean).join(' - ');

/**
 * One sheet row per distinct Code. Line items sharing a code collapse into a
 * single row with their amounts summed; different codes must stay apart.
 */
export function groupForSheet(
  req: SavedRequest,
  links: { receiptsByItem?: Record<string, string[]>; expenseLinks?: string[] } = {},
): SheetRow[] {
  const groups = new Map<string, SavedItem[]>();
  for (const it of req.line_items) {
    const key = it.code ?? '';
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }

  return [...groups.entries()].map(([code, items]) => {
    const dates = [...new Set(items.map((i) => i.spend_date))].sort();
    const receipts = items.flatMap((i) => links.receiptsByItem?.[i.id] ?? []);
    return {
      name: req.payee_name,
      // A shared date prints as itself; a mixed group falls back to the earliest.
      date: mdy(dates[0]),
      amount: usd(items.reduce((s, i) => s + Number(i.amount), 0)),
      item: [...new Set(items.map((i) => i.item_category).filter(Boolean))].join(', '),
      code,
      description: items.map(describe).join('\n'),
      receiptLink: receipts.join('\n'),
      expenseLink: (links.expenseLinks ?? []).join('\n'),
    };
  });
}

/** Tab-separated, with newline-containing cells quoted so a paste lands in one cell. */
export function toTSV(rows: SheetRow[], includeHeaders = false): string {
  const cell = (v: string) => (/[\t\n"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const body = rows.map((r) =>
    [r.name, r.date, r.amount, r.item, r.code, r.description, r.receiptLink, r.expenseLink]
      .map(cell).join('\t'));
  return (includeHeaders ? [SHEET_HEADERS.join('\t'), ...body] : body).join('\n');
}
