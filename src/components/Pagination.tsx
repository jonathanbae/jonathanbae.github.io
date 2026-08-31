export default function Pagination({
  page, pageSize, total, onPage, busy,
}: { page: number; pageSize: number; total: number; onPage: (p: number) => void; busy?: boolean }) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="pager">
      <span className="hint">{first}–{last} of {total}</span>
      <div className="pager-buttons">
        <button type="button" className="button secondary"
          disabled={busy || page === 0} onClick={() => onPage(page - 1)}>Previous</button>
        <button type="button" className="button secondary"
          disabled={busy || page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
