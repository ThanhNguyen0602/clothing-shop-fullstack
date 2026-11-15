import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import { Loading, RequestError } from "../components/products/CatalogUI";
import Pager from "../components/common/Pager";
import { listBrands, listCategories, listProducts } from "../services/catalogService";
import { isCanceled } from "../services/api";

// Khoang gia chuyen thanh minPrice/maxPrice cua API /products.
const PRICE_RANGES = [
  ["", "Tất cả", {}],
  ["under200", "Dưới 200.000đ", { maxPrice: "199999" }],
  ["200to500", "200.000đ – 500.000đ", { minPrice: "200000", maxPrice: "500000" }],
  ["over500", "Trên 500.000đ", { minPrice: "500001" }]
];

const SORTS = [
  ["newest", "Mới nhất"], ["price_asc", "Giá thấp đến cao"],
  ["price_desc", "Giá cao đến thấp"], ["name_asc", "Tên A–Z"]
];

const positivePage = (value) => /^[1-9]\d{0,5}$/.test(value ?? "") ? Number(value) : 1;

const ProductsPage = () => {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const brand = params.get("brand") ?? "";
  const price = params.get("price") ?? "";
  const sort = params.get("sort") ?? "newest";
  const inStock = params.get("inStock") === "1";
  const onSale = params.get("onSale") === "1";
  const page = positivePage(params.get("page"));
  const queryKey = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal).then(setCategories).catch(() => {});
    listBrands(controller.signal).then(setBrands).catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const range = PRICE_RANGES.find(([value]) => value === price)?.[2] ?? {};
    const query = {
      search, category, brand, sort, page, limit: 12,
      inStock: inStock ? "1" : "", onSale: onSale ? "1" : "", ...range
    };

    listProducts(query, controller.signal)
      .then((data) => { setResult({ key: queryKey, attempt, data }); setError(null); })
      .catch((failure) => {
        if (!isCanceled(failure)) setError({ key: queryKey, attempt });
      });

    return () => controller.abort();
  }, [queryKey, attempt, search, category, brand, sort, page, inStock, onSale, price]);

  const change = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  };

  const goTo = (value) => {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const current = result?.key === queryKey && result.attempt === attempt ? result.data : null;
  const failed = error?.key === queryKey && error.attempt === attempt;
  const categoryName = categories.find((item) => String(item.id) === category)?.name;
  const title = search ? `Kết quả cho “${search}”`
    : onSale ? "Đang giảm giá" : categoryName ?? "Tất cả sản phẩm";
  const hasFilter = [category, brand, price, inStock, onSale, search].some(Boolean);

  return (
    <div className="tv-page shop-layout">
      <details className="shop-filters" open>
        <summary>Bộ lọc</summary>

        <div className="filter-group">
          <h2>Danh mục</h2>
          {[{ id: "", name: "Tất cả" }, ...categories].map((item) => (
            <label key={item.id || "all"} className="filter-option">
              <input type="radio" name="category" checked={String(item.id) === category}
                onChange={() => change("category", String(item.id))} />
              {item.name}
            </label>
          ))}
        </div>

        <div className="filter-group">
          <h2>Giá</h2>
          {PRICE_RANGES.map(([value, label]) => (
            <label key={value || "all"} className="filter-option">
              <input type="radio" name="price" checked={value === price}
                onChange={() => change("price", value)} />
              {label}
            </label>
          ))}
        </div>

        {brands.length > 0 && (
          <div className="filter-group">
            <h2>Thương hiệu</h2>
            <select className="form-select form-select-sm" value={brand} aria-label="Thương hiệu"
              onChange={(event) => change("brand", event.target.value)}>
              <option value="">Tất cả</option>
              {brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label className="filter-option">
            <input type="checkbox" checked={inStock}
              onChange={(event) => change("inStock", event.target.checked ? "1" : "")} />
            Chỉ hàng còn sẵn
          </label>
          <label className="filter-option">
            <input type="checkbox" checked={onSale}
              onChange={(event) => change("onSale", event.target.checked ? "1" : "")} />
            Đang giảm giá
          </label>
        </div>

        {hasFilter && (
          <button type="button" className="filter-clear" onClick={() => setParams({})}>
            Xóa bộ lọc
          </button>
        )}
      </details>

      <section className="shop-results" aria-live="polite">
        <div className="shop-toolbar">
          <div>
            <h1>{title}</h1>
            {current && <p>{current.pagination.total} sản phẩm</p>}
          </div>
          <label>Sắp xếp
            <select className="form-select form-select-sm" value={sort}
              onChange={(event) => change("sort", event.target.value)}>
              {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        {failed && <RequestError retry={() => setAttempt((value) => value + 1)} />}
        {!failed && !current && <Loading text="Đang tải sản phẩm…" />}
        {current && current.data.length === 0 && (
          <div className="empty-state">
            <h2>Không có sản phẩm phù hợp</h2>
            <p>Thử bỏ bớt bộ lọc hoặc tìm bằng từ khóa khác.</p>
            <button type="button" className="button" onClick={() => setParams({})}>
              Xem tất cả sản phẩm
            </button>
          </div>
        )}
        {current && current.data.length > 0 && (
          <div className="product-grid product-grid--3">
            {current.data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
        {current && (
          <Pager page={page} totalPages={current.pagination.totalPages} onChange={goTo} />
        )}
      </section>
    </div>
  );
};

export default ProductsPage;
