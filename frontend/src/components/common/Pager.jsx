// Phan trang dung chung: ho tro ca totalPages (san pham) va has_next (don, danh gia).
const Pager = ({ page, totalPages, hasNext, onChange, label = "Phân trang" }) => {
  const last = totalPages ?? (hasNext ? page + 1 : page);

  if (last <= 1 && page <= 1) return null;

  const pages = totalPages
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
      .filter((value) => Math.abs(value - page) <= 2 || value === 1 || value === totalPages)
    : [page];

  return (
    <nav className="tv-pager" aria-label={label}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trước
      </button>
      {pages.map((value, index) => (
        <span key={value}>
          {index > 0 && value - pages[index - 1] > 1 && <em>…</em>}
          <button type="button" aria-current={value === page ? "page" : undefined}
            className={value === page ? "is-active" : ""}
            onClick={() => onChange(value)}>{value}</button>
        </span>
      ))}
      <button type="button" disabled={totalPages ? page >= totalPages : !hasNext}
        onClick={() => onChange(page + 1)}>Sau</button>
    </nav>
  );
};

export default Pager;
