import { Link } from 'react-router-dom';

/** Explicit in-app back navigation, so nobody has to reach for the browser button. */
export default function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link className="backlink" to={to}>← {children}</Link>;
}
