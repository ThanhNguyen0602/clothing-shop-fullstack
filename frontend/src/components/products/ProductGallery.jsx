import { useState } from "react";
import { ProductImage } from "./CatalogUI";

const ProductGallery = ({ product }) => {
  const [selected, setSelected] = useState(null);
  const images = product.images ?? [];
  const primary = images.find((image) => Number(image.is_primary) === 1);
  const active = selected ?? primary?.image_url ??
    product.thumbnail ?? images[0]?.image_url;

  return (
    <div className="product-gallery">
      <div className="product-main-image">
        <ProductImage src={active} alt={product.name} className="" />
      </div>
      {images.length > 1 && (
        <div className="product-thumbnails" role="group" aria-label="Chọn ảnh">
          {images.map((image, index) => (
            <button key={image.id} type="button"
              className={active === image.image_url ? "active" : ""}
              aria-pressed={active === image.image_url}
              aria-label={`Ảnh ${index + 1}`}
              onClick={() => setSelected(image.image_url)}>
              <img src={image.image_url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
