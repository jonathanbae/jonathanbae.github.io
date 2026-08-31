import { useEffect, useRef, useState } from 'react';
import { formatBytes, prepareFiles } from '../lib/compress.ts';

/**
 * Receipt capture aimed at a phone.
 *
 * `capture="environment"` opens the rear camera directly instead of the picker
 * sheet, which is the common case — someone standing at the counter with a
 * paper receipt. A second control still allows the photo library or a PDF.
 * Selections append rather than replace, so adding a second page does not
 * silently drop the first.
 */
export function FilePickButtons({
  onPick, busy, multiple = true,
}: { onPick: (files: File[]) => void; busy?: boolean; multiple?: boolean }) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  const take = (el: HTMLInputElement | null) => {
    if (!el) return;
    const chosen = Array.from(el.files ?? []);
    el.value = '';                    // so picking the same file twice still fires
    if (chosen.length) onPick(chosen);
  };

  return (
    <div className="pickers">
      <input ref={camera} type="file" accept="image/*" capture="environment"
        hidden onChange={() => take(camera.current)} />
      <input ref={library} type="file" accept="image/*,application/pdf" multiple={multiple}
        hidden onChange={() => take(library.current)} />

      <button type="button" className="button secondary" disabled={busy}
        onClick={() => camera.current?.click()}>
        📷 Take photo
      </button>
      <button type="button" className="button secondary" disabled={busy}
        onClick={() => library.current?.click()}>
        Choose file
      </button>
    </div>
  );
}

/** Thumbnails of what is attached, each removable. */
export function ReceiptThumbs({
  files, onRemove,
}: { files: File[]; onRemove: (index: number) => void }) {
  const [urls, setUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    const made = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null));
    setUrls(made);
    return () => made.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  if (!files.length) return null;

  return (
    <ul className="thumbs">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`}>
          {urls[i]
            ? <img src={urls[i]!} alt="" />
            : <span className="thumb-doc" aria-hidden="true">PDF</span>}
          <div className="thumb-meta">
            <span className="thumb-name">{f.name}</span>
            <span className="hint">{formatBytes(f.size)}</span>
          </div>
          <button type="button" className="thumb-x" aria-label={`Remove ${f.name}`}
            onClick={() => onRemove(i)}>×</button>
        </li>
      ))}
    </ul>
  );
}

/** Compress then append. Shared by the new-request form and the edit view. */
export async function appendPrepared(existing: File[], chosen: File[]): Promise<File[]> {
  const prepared = await prepareFiles(chosen);
  return [...existing, ...prepared.map((p) => p.file)];
}
