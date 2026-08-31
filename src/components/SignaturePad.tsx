import { useEffect, useRef, useState } from 'react';

/**
 * Draw-with-your-finger signature capture. Pointer events cover mouse, trackpad
 * and touch with one code path, and the canvas is sized to its own layout box so
 * strokes land under the cursor on high-DPI screens.
 */
export default function SignaturePad({
  onChange, initial,
}: { onChange: (dataUrl: string | null) => void; initial?: string | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(Boolean(initial));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#26333B';
    if (initial) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = initial;
    }
  }, [initial]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  const ctxOf = () => ref.current?.getContext('2d') ?? null;

  return (
    <div className="sigpad">
      <canvas
        ref={ref}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = ctxOf(); if (!ctx) return;
          const { x, y } = pos(e);
          ctx.beginPath(); ctx.moveTo(x, y);
          drawing.current = true;
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ctxOf(); if (!ctx) return;
          const { x, y } = pos(e);
          ctx.lineTo(x, y); ctx.stroke();
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          setDirty(true);
          onChange(ref.current?.toDataURL('image/png') ?? null);
        }}
      />
      <div className="sigpad-bar">
        <span className="hint">{dirty ? 'Signature captured.' : 'Sign inside the box.'}</span>
        <button
          type="button" className="link"
          onClick={() => {
            const c = ref.current, ctx = ctxOf();
            if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
            setDirty(false);
            onChange(null);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
