export type Category = { name: string; code: string };

export type ReceiptMode = 'in_person' | 'needs_printing';

/** One receipt on the form being filled in, before it is saved. */
export type DraftItem = {
  key: string;
  item_category: string | null;
  description: string;   // prints as line 1 of the PDF's Description cell
  vendor: string;        // prints as line 2, indented
  amount: string;        // kept as typed; parsed on submit
  spend_date: string;
  receipt_mode: ReceiptMode;
  files: File[];
};

// A receipt file is always required; this only says whether the paper original
// is coming in by hand or whether finance needs to print a copy.
export const RECEIPT_MODE_LABELS: Record<ReceiptMode, string> = {
  in_person: 'I will also hand in the paper receipt',
  needs_printing: 'Please print my receipt for me',
};

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'];
export const MAX_DESCRIPTION = 40;
