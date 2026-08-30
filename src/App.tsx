import { Suspense, lazy } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.tsx';
import Login from './routes/Login.tsx';
import Home from './routes/Home.tsx';
import NewRequest from './routes/NewRequest.tsx';
import ViewExisting from './routes/ViewExisting.tsx';
import RequestDetail from './routes/RequestDetail.tsx';

// The admin screens pull in pdf-lib and the blank form; keep that off the
// critical path for submitters, who never generate a PDF.
const AdminQueue = lazy(() => import('./routes/AdminQueue.tsx'));
const AdminDetail = lazy(() => import('./routes/AdminDetail.tsx'));

function SideNav() {
  const { role } = useAuth();
  const item = ({ isActive }: { isActive: boolean }) => `navlink${isActive ? ' on' : ''}`;
  return (
    <nav className="sidenav" aria-label="Sections">
      <NavLink to="/" end className={item}>Overview</NavLink>
      <NavLink to="/new" className={item}>New request</NavLink>
      <NavLink to="/view" className={item}>My requests</NavLink>
      {role === 'admin' && <NavLink to="/admin" className={item}>Finance queue</NavLink>}
    </nav>
  );
}

function Header() {
  const { signOut, role } = useAuth();
  const nav = useNavigate();
  return (
    <header className="bar">
      <Link to="/" className="brand">Chara Reimbursement</Link>
      <div className="bar-right">
        {role && <span className="dim">{role}</span>}
        <button className="link" onClick={async () => { await signOut(); nav('/login', { replace: true }); }}>
          Sign out
        </button>
      </div>
    </header>
  );
}

/** Nothing below this renders without a session. */
function Protected({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, role, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/" replace />;
  return (
    <>
      <Header />
      <div className="layout">
        <SideNav />
        <main className="wrap">
          <Suspense fallback={<p className="muted">Loading…</p>}><Outlet /></Suspense>
        </main>
      </div>
    </>
  );
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
        <Route element={<Protected adminOnly />}>
          <Route path="/admin" element={<AdminQueue />} />
          <Route path="/admin/:id" element={<AdminDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
