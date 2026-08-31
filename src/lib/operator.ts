/**
 * Who is sitting at the shared admin or pastor login, for this browser session.
 *
 * The three logins are shared passwords, so `auth.uid()` identifies a role, not
 * a person — every staff action would otherwise land in the audit log with a
 * NULL actor. We ask for a name and stamp it on each entry.
 *
 * Deliberately `sessionStorage`, not `localStorage`: several pastors share the
 * one login, so a signature or a name left behind from yesterday would be
 * applied to today's approvals by whoever sits down next. Session scope means
 * closing the tab forgets both, and the next person is asked who they are.
 *
 * This is bookkeeping, not authentication: someone could type any name. It
 * makes the log useful for "who signed this", not for proving it.
 */
const KEY = 'chara.operator';
const SIG_KEY = 'chara.signature';

/** sessionStorage throws in some privacy modes; never let that break a page. */
function read(key: string): string | null {
  try {
    const v = sessionStorage.getItem(key);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try { sessionStorage.setItem(key, value); } catch { /* non-fatal */ }
}

export const getOperator = () => read(KEY);
export const setOperator = (name: string) => write(KEY, name.trim());

/** The pastor's drawn signature, kept only for as long as this tab is open. */
export const getSignature = () => read(SIG_KEY);
export const setSignature = (dataUrl: string) => write(SIG_KEY, dataUrl);

export function clearOperator() {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(SIG_KEY);
    // Older builds kept these in localStorage; clear those out too.
    localStorage.removeItem(KEY);
    localStorage.removeItem(SIG_KEY);
  } catch { /* non-fatal */ }
}

/** Label for an audit row; falls back so an entry is never anonymous by accident. */
export const auditActor = () => getOperator() ?? 'staff (unnamed)';
