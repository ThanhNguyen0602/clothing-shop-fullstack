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

export { validProductId, priceText, dateText, variantPrice, moneyInput };
