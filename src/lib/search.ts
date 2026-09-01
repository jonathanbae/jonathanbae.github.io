/**
 * Make a user's search box safe to interpolate into a PostgREST `.or()` filter.
 *
 * `.or()` takes a filter *expression*, not a bound value, so raw input could
 * inject extra conditions — `,` separates them and `()` groups them. This is
 * filter injection, not SQL injection (PostgREST still parameterises the value
 * it parses out), but it would let a caller widen their own query, so the
 * grammar characters are stripped rather than escaped.
 *
 * Dots and `@` survive because email addresses need them; `%` is dropped so a
 * search cannot be turned into a full table scan.
 *
 * Kept dependency-free so it can be unit tested without a Supabase client.
 */
export const sanitizeSearch = (q: string) =>
  q.replace(/[^a-zA-Z0-9 @._-]/g, '').trim().slice(0, 60);
