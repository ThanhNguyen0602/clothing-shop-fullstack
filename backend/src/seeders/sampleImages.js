// Anh minh hoa san pham (SVG) nam trong backend/public/samples, phuc vu qua GET /samples/...
// Khong phu thuoc dich vu anh ben ngoai nen luon hien thi duoc khi chay local.
const TYPE_BY_CATEGORY = {
  "ao-thun": "tee", "ao-so-mi": "shirt", "ao-khoac": "jacket", "quan-jeans": "jeans",
  "quan-kaki-short": "pants", "vay-dam": "dress", "phu-kien-thoi-trang": "cap"
};
const COLORS = ["navy", "black", "beige", "olive", "white", "burgundy", "denim"];

const origin = () => (process.env.PUBLIC_API_ORIGIN ||
  `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, "");

const typeOf = (categorySlug) => TYPE_BY_CATEGORY[categorySlug] ?? "tee";

// Mau chon theo SKU de moi san pham co mau rieng nhung chay lai van giong nhau.
const colorIndex = (sku) => [...sku].reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLORS.length;

const url = (type, color) => `${origin()}/samples/${type}-${color}.svg`;

const sampleImages = (categorySlug, sku) => {
  const type = typeOf(categorySlug);
  const index = colorIndex(sku);

  return [url(type, COLORS[index]), url(type, COLORS[(index + 3) % COLORS.length])];
};

const categoryImage = (categorySlug) => url(typeOf(categorySlug), "beige");

const isSampleOrPlaceholder = (value) => !value || /placehold\.co|\/samples\//.test(value);

module.exports = { sampleImages, categoryImage, isSampleOrPlaceholder, TYPE_BY_CATEGORY };
