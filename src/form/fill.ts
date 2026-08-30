import { PDFDocument, PDFName, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { L, MAX_ROWS } from './layout.ts';

export type FormLineItem = {
  /** prints as line 1 of the Description cell */
  category: string;
  /** prints as line 2, indented */
  vendor: string;
  /** 6060, or 6070 for the EM Retreat */
  accountNumber: string;
  /** the numeric code — this is what the "Name of Account" column wants */
  code: string;
  amount: number;
};

export type FormRequest = {
  educationDept: string;
  payee: string;
  address?: string;
  requester?: string;
  requestedDate?: Date | null;
  lineItems: FormLineItem[];
};

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const mdyy = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;

/** The form's table holds 4 rows, so longer requests become several standalone forms. */
export function chunkRows<T>(items: T[], size = MAX_ROWS): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length ? out : [[]];
}

export async function fillForm(
  templateBytes: ArrayBuffer | Uint8Array,
  req: FormRequest,
): Promise<Uint8Array> {
  const pages = chunkRows(req.lineItems);
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const tpl = await PDFDocument.load(templateBytes);

  for (const items of pages) {
    const [page] = await out.copyPages(tpl, [0]);
    // The blank form ships with /Square markup annotations that white out the stale
    // preprinted years. Annotations paint ABOVE page content, so they would cover
    // anything we draw there — drop them and do the masking ourselves.
    page.node.delete(PDFName.of('Annots'));
    out.addPage(page);

    const text = (s: string | null | undefined, x: number, y: number, size = 9, f: PDFFont = font) => {
      if (s == null || s === '') return;
      page.drawText(String(s), { x, y, size, font: f });
    };
    const centered = (s: string, box: { x0: number; x1: number }, y: number, size = 10, f: PDFFont = font) => {
      if (!s) return;
      text(s, (box.x0 + box.x1) / 2 - f.widthOfTextAtSize(s, size) / 2, y, size, f);
    };
    const right = (s: string, edge: number, y: number, size = 10, f: PDFFont = font) => {
      if (!s) return;
      text(s, edge - f.widthOfTextAtSize(s, size), y, size, f);
    };
    const cross = (b: { x: number; y: number; s: number }, p: PDFPage = page) => {
      const pad = 1.6, o = { thickness: 1.2, color: rgb(0, 0, 0) };
      p.drawLine({ start: { x: b.x + pad, y: b.y + pad }, end: { x: b.x + b.s - pad, y: b.y + b.s - pad }, ...o });
      p.drawLine({ start: { x: b.x + pad, y: b.y + b.s - pad }, end: { x: b.x + b.s - pad, y: b.y + pad }, ...o });
    };

    centered(req.educationDept, L.deptCell, (L.deptCell.y0 + L.deptCell.y1) / 2 - 4, 11, bold);

    items.forEach((it, i) => {
      const [top, bot] = L.rows[i];
      const mid = (top + bot) / 2;
      text(it.category, L.cols.desc.x0 + 4, top - 10.5, 8);
      text(it.vendor, L.cols.desc.x0 + 16, top - 20.5, 8);
      centered(it.accountNumber, L.cols.acct, mid - 4);
      centered(it.code, L.cols.code, mid - 4);
      right(money(it.amount), L.cols.amt.x1 - 10, mid - 4);
    });

    // Each form is standalone, so the total covers only the rows on this page.
    right(money(items.reduce((s, i) => s + i.amount, 0)), L.totalRightEdge, L.totalBaseline, 11, bold);

    cross(L.checkbox.check);     // payment method is always Check
    cross(L.checkbox.attached);  // receipts are always attached

    text(req.payee, L.payee.x, L.payee.baseline, 10);
    text(req.address, L.address.x, L.address.baseline, 9);
    text(req.requester, L.requester.x, L.requester.baseline, 10);

    if (req.requestedDate) {
      const m = L.reqDate.mask;
      page.drawRectangle({ x: m.x, y: m.y, width: m.w, height: m.h, color: rgb(1, 1, 1) });
      text(mdyy(req.requestedDate), L.reqDate.x, L.reqDate.baseline, 10);
    }
    const rm = L.recvDateMask;
    page.drawRectangle({ x: rm.x, y: rm.y, width: rm.w, height: rm.h, color: rgb(1, 1, 1) });
  }
  return out.save();
}
