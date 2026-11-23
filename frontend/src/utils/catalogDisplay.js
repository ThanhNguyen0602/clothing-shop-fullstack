const validProductId = (value) => /^[1-9]\d*$/.test(value) &&
  Number(value) <= 2147483647;

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency", currency: "VND", maximumFractionDigits: 2
});

const priceText = (amount) => currency.format(Number(amount));

const dateText = (value) => value
  ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
  : "";

// Gia mot bien the = gia ban + chenh lech (backend tinh lai khi them gio).
const variantPrice = (product, variant) => variant
  ? (Number(product.sale_price) + Number(variant.price_adjustment)).toFixed(2)
  : product.sale_price;

// Chuyen so trong o nhap thanh chuoi tien "123000.00" dung dinh dang backend yeu cau.
const moneyInput = (value) => {
  const text = String(value ?? "").trim();

  return /^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(text) ? text : null;
};

// Anh upload luu URL http://localhost:3000/...; khi chay qua proxy Vite (VITE_API_URL="/api")
// doi sang duong dan cung origin de xem duoc tren Codespaces.
const imageSrc = (src) => src && import.meta.env.VITE_API_URL?.startsWith("/")
  ? src.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+(?=\/(uploads|samples)\/)/, "")
  : src;

export { imageSrc, validProductId, priceText, dateText, variantPrice, moneyInput };
