// "Áo thun Trắng" -> "ao-thun-trang" (khop rule slug cua backend).
const slugify = (value) => value
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  .slice(0, 255);

export default slugify;
