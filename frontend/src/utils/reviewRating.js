// Bo sung Buoi 11 - Hieu: chuan hoa du lieu tong hop rating tu API.
// Khong tinh trung binh tu 5 danh gia cua trang hien tai, vi API da tinh
// AVG tren TAT CA review VISIBLE cua san pham.
const getReviewOverview = (summary) => {
  const rawCount = Number(summary?.count);
  const count = Number.isFinite(rawCount) ? Math.max(0, Math.trunc(rawCount)) : 0;
  const rawAverage = Number(summary?.average);
  const average = count > 0 && Number.isFinite(rawAverage)
    ? Math.min(5, Math.max(0, rawAverage)) : 0;

  return {
    count,
    average,
    percentage: Math.round((average / 5) * 100)
  };
};

export { getReviewOverview };
