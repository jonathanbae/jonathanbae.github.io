import { useEffect, useState } from 'react';
import { signedReceiptUrl } from '../lib/api.ts';

type Receipt = { id: string; storage_path: string; mime: string | null };

/**
 * Receipts shown inline rather than one-new-tab-per-file. Reviewing a request
 * with six receipts should not mean six round trips through the tab bar.
 */
export default function ReceiptGallery({ receipts }: { receipts: Receipt[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const r of receipts) {
        const u = await signedReceiptUrl(r.storage_path);
        if (u) next[r.id] = u;
      }
      if (!cancelled) setUrls(next);
    })();
    return () => { cancelled = true; };
  }, [receipts]);

  if (!receipts.length) {
    return (
      <p className="error small">
        Nothing attached — the form ticks "Attached", so this must be resolved first.
      </p>
    );
  }

  return (
    <ul className="gallery">
      {receipts.map((r) => {
        const url = urls[r.id];
        const isImage = (r.mime ?? '').startsWith('image/');
        const name = r.storage_path.split('/').pop();
        return (
          <li key={r.id}>
            <a href={url} target="_blank" rel="noopener noreferrer"
               title={`Open ${name} full size`} className={url ? '' : 'loading'}>
              {isImage && url
                ? <img src={url} alt={name} loading="lazy" />
                : <span className="gallery-doc">{isImage ? '…' : 'PDF'}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
