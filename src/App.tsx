import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import logoMark from './assets/logo-mark.png';
import { AuthProvider, useAuth } from './lib/auth.tsx';
import OperatorGate from './components/OperatorGate.tsx';
import { clearOperator, getOperator, setOperator } from './lib/operator.ts';
import Login from './routes/Login.tsx';
import Home from './routes/Home.tsx';
import NewRequest from './routes/NewRequest.tsx';
import ViewExisting from './routes/ViewExisting.tsx';
import RequestDetail from './routes/RequestDetail.tsx';

// The admin screens pull in pdf-lib and the blank form; keep that off the
// critical path for submitters, who never generate a PDF.
const AdminQueue = lazy(() => import('./routes/AdminQueue.tsx'));
const AdminDetail = lazy(() => import('./routes/AdminDetail.tsx'));
const PastorQueue = lazy(() => import('./routes/PastorQueue.tsx'));

function SideNav({ open }: { open: boolean }) {
  const { role } = useAuth();
  const item = ({ isActive }: { isActive: boolean }) => `navlink${isActive ? ' on' : ''}`;
  return (
    <nav id="sidenav" className={`sidenav${open ? ' open' : ''}`} aria-label="Sections">
      <NavLink to="/" end className={item}>Overview</NavLink>
      <NavLink to="/new" className={item}>New request</NavLink>
      <NavLink to="/view" className={item}>My requests</NavLink>
      {role === 'pastor' && <NavLink to="/approvals" className={item}>Approvals</NavLink>}
      {role === 'admin' && <NavLink to="/admin" className={item}>Finance queue</NavLink>}
    </nav>
  );
}

function Header({ menuOpen, onToggleMenu }: { menuOpen: boolean; onToggleMenu: () => void }) {
  const { signOut, role } = useAuth();
  const nav = useNavigate();
  const operator = getOperator();

  function rename() {
    const next = window.prompt('Who is using this login?', operator ?? '');
    if (next && next.trim().length >= 2) { setOperator(next); nav(0); }
  }

  return (
    <header className="bar">
      <div className="bar-left">
        {/* The logo doubles as the menu button on narrow screens. */}
        <button
          type="button"
          className="hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="sidenav"
          onClick={onToggleMenu}
        >
          <img src={logoMark} alt="" />
          <svg viewBox="0 0 20 14" width="18" height="13" aria-hidden="true">
            {menuOpen
              ? <><line x1="3" y1="2" x2="17" y2="12" /><line x1="17" y1="2" x2="3" y2="12" /></>
              : <><line x1="1" y1="2" x2="19" y2="2" /><line x1="1" y1="7" x2="19" y2="7" />
                 <line x1="1" y1="12" x2="19" y2="12" /></>}
          </svg>
        </button>
        <Link to="/" className="brand">
          <img src={logoMark} alt="Chara Community" />
          <span>Chara Reimbursement</span>
        </Link>
      </div>
      <div className="bar-right">
        {(role === 'admin' || role === 'pastor') && operator
          ? <button className="link" onClick={rename} title="Change who is using this login">{operator}</button>
          : role && <span className="dim">{role}</span>}
        <button
          className="link"
          onClick={async () => { clearOperator(); await signOut(); nav('/login', { replace: true }); }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Navigating closes the drawer, so a tap on a link does not leave it hanging open.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Header menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((o) => !o)} />
      <div className="layout">
        {menuOpen && <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />}
        <SideNav open={menuOpen} />
        <main className="wrap">
          <Suspense fallback={<p className="muted">Loading…</p>}><Outlet /></Suspense>
        </main>
      </div>
    </>
  );
}

/** Nothing below this renders without a session. */
function Protected({ allow }: { allow?: Array<'admin' | 'pastor' | 'user'> }) {
  const { session, role, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (allow && !(role && allow.includes(role))) return <Navigate to="/" replace />;
  // Shared logins: staff must say who they are so the audit log names a person.
  const needsName = role === 'admin' || role === 'pastor';
  return needsName ? <OperatorGate><Shell /></OperatorGate> : <Shell />;
}

function LoginGate() {
  const { session, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  return session ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewRequest />} />
          <Route path="/view" element={<ViewExisting />} />
          <Route path="/request/:id" element={<RequestDetail />} />
        </Route>
        <Route element={<Protected allow={['pastor']} />}>
          <Route path="/approvals" element={<PastorQueue />} />
        </Route>
        <Route element={<Protected allow={['admin']} />}>
          <Route path="/admin" element={<AdminQueue />} />
          <Route path="/admin/:id" element={<AdminDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
