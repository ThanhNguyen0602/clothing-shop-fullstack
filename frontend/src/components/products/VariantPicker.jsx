// Chon mau truoc, sau do chon size con trong mau do.
const VariantPicker = ({ variants, color, size, onChange }) => {
  const colors = [...new Set(variants.map((item) => item.color))];
  const sizes = [...new Set(variants.map((item) => item.size))];
  const find = (nextColor, nextSize) => variants.find((item) =>
    item.color === nextColor && item.size === nextSize);

  return (
    <>
      <div className="product-option">
        <span>Màu sắc{color ? `: ${color}` : ""}</span>
        <div className="option-buttons" role="group" aria-label="Chọn màu">
          {colors.map((value) => (
            <button key={value} type="button" aria-pressed={value === color}
              className={value === color ? "active" : ""}
              onClick={() => onChange(value, find(value, size) ? size : null)}>
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="product-option">
        <span>Kích thước{size ? `: ${size}` : ""}</span>
        <div className="option-buttons" role="group" aria-label="Chọn size">
          {sizes.map((value) => {
            const variant = color ? find(color, value) : null;
            const disabled = !color || !variant || Number(variant.stock_quantity) <= 0;

            return (
              <button key={value} type="button" disabled={disabled}
                aria-pressed={value === size}
                className={value === size ? "active" : ""}
                title={variant && Number(variant.stock_quantity) <= 0 ? "Hết hàng" : undefined}
                onClick={() => onChange(color, value)}>
                {value}
              </button>
            );
          })}
        </div>
        {!color && <p className="variant-stock">Chọn màu để xem size còn hàng.</p>}
      </div>
    </>
  );
};

export default VariantPicker;
