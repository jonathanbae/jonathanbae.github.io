import { useState } from 'react';
import { getOperator, setOperator } from '../lib/operator.ts';

/**
 * Blocks the admin area until whoever is using the shared login says who they
 * are, so the audit log records a person rather than a role.
 */
export default function OperatorGate({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState(getOperator());
  const [draft, setDraft] = useState('');

  if (name) return <>{children}</>;

  const ok = draft.trim().length >= 2;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="who-title">
      <form
        className="card modal stack-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          setOperator(draft);
          setName(draft.trim());
        }}
      >
        <h2 id="who-title">Who is using this login?</h2>
        <p className="muted">
          The finance login is shared, so we record your name against anything you
          approve, edit or mark paid. You will only be asked once on this device.
        </p>
        <label>
          Your name
          <input value={draft} autoFocus onChange={(e) => setDraft(e.target.value)} />
        </label>
        <button disabled={!ok}>Continue</button>
      </form>
    </div>
  );
}
