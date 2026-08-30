/**
 * Shrink phone photos before they are uploaded.
 *
 * A modern phone camera produces 4–12 MB images; a receipt is legible at a
 * fraction of that. Downscaling in the browser keeps uploads fast on church
 * wifi and keeps Supabase's 1 GB storage from filling up with camera noise.
 *
 * PDFs and anything that fails to decode are passed through untouched, so a
 * compression failure can never cost someone their receipt.
 */

/** Long edge, in pixels. Comfortably readable for receipt text. */
export const MAX_EDGE = 2000;
export const JPEG_QUALITY = 0.82;

export type Prepared = { file: File; originalSize: number; shrunk: boolean };

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

async function shrink(file: File): Promise<File> {
  // `from-image` applies the EXIF rotation, so photos taken sideways stay upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('encode failed');

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
}

export async function prepareFile(file: File): Promise<Prepared> {
  const original = { file, originalSize: file.size, shrunk: false };
  if (!file.type.startsWith('image/')) return original;
  try {
    const out = await shrink(file);
    // Re-encoding can enlarge an already-optimised image; keep the smaller one.
    if (out.size >= file.size) return original;
    return { file: out, originalSize: file.size, shrunk: true };
  } catch {
    // HEIC on browsers that cannot decode it, out-of-memory, etc.
    return original;
  }
}

export const prepareFiles = (files: File[]) => Promise.all(files.map(prepareFile));
