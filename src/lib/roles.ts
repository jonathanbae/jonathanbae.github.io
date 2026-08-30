export type Role = 'admin' | 'pastor' | 'user';

// The three shared logins. Create these accounts in Supabase → Authentication →
// Users, then add a matching row to public.profiles with the role.
const DOMAIN = import.meta.env.VITE_LOGIN_DOMAIN ?? 'characommunity.org';

export const ROLE_EMAILS: Record<Role, string> = {
  user: `finance.user@${DOMAIN}`,
  pastor: `finance.pastor@${DOMAIN}`,
  admin: `finance.admin@${DOMAIN}`,
};

export const ROLE_LABELS: Record<Role, string> = {
  user: 'Submitter',
  pastor: 'Pastor',
  admin: 'Finance / Admin',
};
